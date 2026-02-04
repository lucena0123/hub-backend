import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Script, createContext } from 'node:vm';

type V5NodeDetails = Record<
  string,
  {
    sla?: string | null;
    tag?: string | null;
    desc?: string | null;
  }
>;

type V5Phase = { name: string; x: number; width: number };

type V5SubprocessData = {
  diagramXML: string;
  nodeDetails?: V5NodeDetails;
  phases?: V5Phase[];
  zoom?: number;
  storageKey?: string;
  startLabel?: string;
  endLabels?: Record<string, unknown>;
  showDefaultEndLabel?: boolean;
  useEndName?: boolean;
  defaultEndLabelText?: string;
  defaultEndClass?: string;
};

export type BpmnNodeType =
  | 'startEvent'
  | 'endEvent'
  | 'task'
  | 'exclusiveGateway'
  | 'parallelGateway'
  | 'inclusiveGateway';

export type BpmnNode = {
  id: string;
  name: string | null;
  type: BpmnNodeType;
  lane: { id: string; name: string | null } | null;
  details: { sla: string | null; tag: string | null; desc: string | null } | null;
};

export type BpmnSequenceFlow = {
  id: string;
  sourceRef: string;
  targetRef: string;
};

export type BpmnLane = {
  id: string;
  name: string | null;
  nodeIds: string[];
};

export type BpmnSubprocessDefinition = {
  id: string;
  diagramXML: string;
  nodes: BpmnNode[];
  flows: BpmnSequenceFlow[];
  lanes: BpmnLane[];
  phases: V5Phase[];
  config: {
    zoom?: number;
    storageKey?: string;
    startLabel?: string;
    endLabels?: Record<string, unknown>;
    showDefaultEndLabel?: boolean;
    useEndName?: boolean;
    defaultEndLabelText?: string;
    defaultEndClass?: string;
  };
};

export class BpmnDefinitionNotFoundError extends Error {
  constructor(public subprocessId: string, message: string) {
    super(message);
    this.name = 'BpmnDefinitionNotFoundError';
  }
}

export class BpmnDefinitionInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BpmnDefinitionInvalidError';
  }
}

const resolveProcessosDir = () => {
  const explicit = process.env.BPMN_PROCESS_DIR?.trim();
  if (explicit) return explicit;

  const candidates = [path.resolve(process.cwd(), 'processos'), path.resolve(process.cwd(), '..', 'processos')];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
};

const parseAttributes = (tag: string) => {
  const attrs: Record<string, string> = {};
  const re = /([:\w-]+)\s*=\s*"([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
};

const parseDiagramXml = (diagramXML: string) => {
  const nodesById = new Map<string, Omit<BpmnNode, 'lane' | 'details'>>();
  const flows: BpmnSequenceFlow[] = [];

  const collectNodes = (tag: string, type: BpmnNodeType) => {
    const re = new RegExp(`<bpmn:${tag}\\b[^>]*\\/?>`, 'g');
    const matches = diagramXML.match(re) ?? [];
    for (const raw of matches) {
      const attrs = parseAttributes(raw);
      const id = attrs.id;
      if (!id) continue;
      nodesById.set(id, { id, name: attrs.name ?? null, type });
    }
  };

  collectNodes('startEvent', 'startEvent');
  collectNodes('endEvent', 'endEvent');
  collectNodes('task', 'task');
  collectNodes('exclusiveGateway', 'exclusiveGateway');
  collectNodes('parallelGateway', 'parallelGateway');
  collectNodes('inclusiveGateway', 'inclusiveGateway');

  const flowMatches = diagramXML.match(/<bpmn:sequenceFlow\b[^>]*\/?>/g) ?? [];
  for (const raw of flowMatches) {
    const attrs = parseAttributes(raw);
    const id = attrs.id;
    const sourceRef = attrs.sourceRef;
    const targetRef = attrs.targetRef;
    if (!id || !sourceRef || !targetRef) continue;
    flows.push({ id, sourceRef, targetRef });
  }

  return {
    nodes: Array.from(nodesById.values()),
    flows,
  };
};

const parseLanes = (diagramXML: string): BpmnLane[] => {
  const lanes: BpmnLane[] = [];

  const laneBlocks = diagramXML.match(/<bpmn:lane\b[\s\S]*?<\/bpmn:lane>/g) ?? [];
  for (const block of laneBlocks) {
    const openTagMatch = block.match(/<bpmn:lane\b[^>]*>/);
    if (!openTagMatch) continue;
    const attrs = parseAttributes(openTagMatch[0]);
    const id = attrs.id;
    if (!id) continue;

    const nodeIds: string[] = [];
    const refMatches = block.match(/<bpmn:flowNodeRef>[^<]+<\/bpmn:flowNodeRef>/g) ?? [];
    for (const raw of refMatches) {
      const idMatch = raw.match(/<bpmn:flowNodeRef>([^<]+)<\/bpmn:flowNodeRef>/);
      if (idMatch?.[1]) nodeIds.push(idMatch[1]);
    }

    lanes.push({ id, name: attrs.name ?? null, nodeIds });
  }

  return lanes;
};

const loadV5SubprocessData = async (subprocessId: string, processosDir: string): Promise<V5SubprocessData> => {
  const filename = path.join(processosDir, `subprocesso-${subprocessId}-v5-data.js`);
  let code: string;
  try {
    code = await readFile(filename, 'utf8');
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') {
      throw new BpmnDefinitionNotFoundError(subprocessId, `Arquivo nao encontrado: ${filename}`);
    }
    throw err;
  }

  const sandbox: { window: Record<string, unknown> } = { window: {} };
  createContext(sandbox);

  const script = new Script(code, { filename });
  script.runInContext(sandbox, { timeout: 1500 });

  const v5Data = (sandbox.window as any).v5Data;
  const data = v5Data?.[subprocessId] as V5SubprocessData | undefined;
  if (!data || typeof data.diagramXML !== 'string') {
    throw new BpmnDefinitionNotFoundError(subprocessId, `Definicao v5Data['${subprocessId}'] nao encontrada no arquivo.`);
  }

  return data;
};

export class BpmnDefinitionService {
  private cache = new Map<string, BpmnSubprocessDefinition>();
  private processosDir = resolveProcessosDir();

  async getSubprocessDefinition(subprocessIdRaw: string): Promise<BpmnSubprocessDefinition> {
    const subprocessId = String(subprocessIdRaw ?? '').trim();
    if (!/^\d+\.\d+$/.test(subprocessId)) {
      throw new BpmnDefinitionInvalidError('Subprocesso invalido (formato esperado: X.Y, ex.: 5.1).');
    }

    const cached = this.cache.get(subprocessId);
    if (cached) return cached;

    const data = await loadV5SubprocessData(subprocessId, this.processosDir);
    const diagramXML = data.diagramXML;
    const nodeDetails = data.nodeDetails ?? {};

    const { nodes: rawNodes, flows } = parseDiagramXml(diagramXML);
    const lanes = parseLanes(diagramXML);

    const laneByNodeId = new Map<string, { id: string; name: string | null }>();
    for (const lane of lanes) {
      for (const nodeId of lane.nodeIds) {
        laneByNodeId.set(nodeId, { id: lane.id, name: lane.name });
      }
    }

    const nodes: BpmnNode[] = rawNodes.map((node) => {
      const detailsRaw = nodeDetails[node.id] ?? null;
      const details = detailsRaw
        ? {
            sla: detailsRaw.sla ?? null,
            tag: detailsRaw.tag ?? null,
            desc: detailsRaw.desc ?? null,
          }
        : null;

      return {
        ...node,
        lane: laneByNodeId.get(node.id) ?? null,
        details,
      };
    });

    const definition: BpmnSubprocessDefinition = {
      id: subprocessId,
      diagramXML,
      nodes,
      flows,
      lanes,
      phases: Array.isArray(data.phases) ? data.phases : [],
      config: {
        zoom: data.zoom,
        storageKey: data.storageKey,
        startLabel: data.startLabel,
        endLabels: data.endLabels,
        showDefaultEndLabel: data.showDefaultEndLabel,
        useEndName: data.useEndName,
        defaultEndLabelText: data.defaultEndLabelText,
        defaultEndClass: data.defaultEndClass,
      },
    };

    this.cache.set(subprocessId, definition);
    return definition;
  }
}
