export const COMMERCIAL_SCHEMA_SQL = `
      CREATE TABLE IF NOT EXISTS commercial_leads (
        lead_id UUID PRIMARY KEY,
        data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        origem TEXT NOT NULL,
        nome_escritorio TEXT NOT NULL,
        instagram TEXT,
        whatsapp TEXT,
        email TEXT,
        nome_contato TEXT,
        cidade TEXT,
        area_principal TEXT,
        qtd_advogados INT,
        faturamento_estimado NUMERIC(12,2),
        orcamento_marketing NUMERIC(12,2),
        timezone TEXT DEFAULT 'America/Sao_Paulo',
        val_proposta NUMERIC(12,2),
        cal_event_id TEXT,
        data_diagnostico TIMESTAMPTZ,
        url_proposta TEXT,
        score_qualificacao SMALLINT,
        status_atual TEXT NOT NULL,
        responsavel TEXT NOT NULL,
        proxima_acao TEXT,
        data_proxima_acao TIMESTAMPTZ,
        motivo_nutricao TEXT,
        motivo_perda TEXT,
        dor01_ok BOOLEAN NOT NULL DEFAULT FALSE,
        dor02_ok BOOLEAN NOT NULL DEFAULT FALSE,
        dor03_ok BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_lead_transitions (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        status_origem TEXT NOT NULL,
        status_destino TEXT NOT NULL,
        actor TEXT,
        observacao TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_integration_events (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        channel TEXT NOT NULL,
        event_type TEXT NOT NULL,
        external_event_id TEXT,
        payload_json JSONB,
        occurred_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_stage_requirements (
        id UUID PRIMARY KEY,
        stage TEXT NOT NULL,
        requirement_key TEXT NOT NULL,
        requirement_type TEXT NOT NULL,
        config_json JSONB,
        is_required BOOLEAN NOT NULL DEFAULT TRUE,
        profile_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_lead_requirement_status (
        lead_id UUID NOT NULL,
        requirement_id UUID NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        evidence_json JSONB,
        verified_by TEXT,
        verified_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (lead_id, requirement_id)
      );

      CREATE TABLE IF NOT EXISTS commercial_assets (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        stage TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        storage_provider TEXT NOT NULL DEFAULT 'google_drive',
        storage_ref TEXT,
        url TEXT NOT NULL,
        version INT NOT NULL DEFAULT 1,
        checksum TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_templates (
        id UUID PRIMARY KEY,
        channel TEXT NOT NULL,
        stage TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_template_versions (
        id UUID PRIMARY KEY,
        template_id UUID NOT NULL,
        version INT NOT NULL,
        content_json JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_template_bindings (
        id UUID PRIMARY KEY,
        stage TEXT NOT NULL,
        channel TEXT NOT NULL,
        profile_key TEXT,
        template_version_id UUID NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_tokens (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_invites (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        token_hash TEXT NOT NULL,
        suggested_slots_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        expires_at TIMESTAMPTZ NOT NULL,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        whatsapp_dispatch_external_id TEXT
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_quick_tokens (
        id UUID PRIMARY KEY,
        invite_id UUID NOT NULL,
        lead_id UUID NOT NULL,
        slot_start TIMESTAMPTZ NOT NULL,
        slot_end TIMESTAMPTZ NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_whatsapp_inbound_events (
        id UUID PRIMARY KEY,
        provider_message_id TEXT NOT NULL,
        from_phone TEXT,
        lead_id UUID,
        invite_id UUID,
        intent TEXT,
        status TEXT NOT NULL,
        reason_code TEXT,
        raw_payload_json JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS commercial_calendar_configs (
        id UUID PRIMARY KEY,
        responsavel_key TEXT NOT NULL UNIQUE,
        calendar_id TEXT NOT NULL,
        booking_url TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_calendar_sync_state (
        calendar_config_id UUID PRIMARY KEY,
        sync_token TEXT,
        last_synced_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_reconciliation_queue (
        id UUID PRIMARY KEY,
        calendar_config_id UUID NOT NULL,
        google_event_id TEXT NOT NULL,
        attendee_email TEXT,
        event_start TIMESTAMPTZ,
        event_end TIMESTAMPTZ,
        payload_json JSONB,
        reason_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        lead_id UUID,
        resolved_by TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS nome_contato TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qtd_advogados INT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS faturamento_estimado NUMERIC(12,2);
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS orcamento_marketing NUMERIC(12,2);
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS val_proposta NUMERIC(12,2);
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_event_id TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS data_diagnostico TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS url_proposta TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS score_qualificacao SMALLINT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_token TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_type TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_submitted_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_payload_json JSONB;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS contract_status TEXT NOT NULL DEFAULT 'pendente';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendente';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS followup_d2_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS followup_d5_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d0_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d1_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d2_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d3_d4_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d5_d7_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qualification_tier TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qualification_reasons_json JSONB;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qualification_updated_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS last_scheduling_invite_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS last_scheduling_invite_channels_json JSONB;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS scheduled_from TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_event_url TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_meet_url TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_organizer_email TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_synced_at TIMESTAMPTZ;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'hub_public';
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS booking_url TEXT;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS redirect_token_hash TEXT;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS redirect_clicked_at TIMESTAMPTZ;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS whatsapp_dispatch_external_id TEXT;

      CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON commercial_leads(status_atual);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_responsavel ON commercial_leads(responsavel);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_form_type ON commercial_leads(form_type);
      CREATE INDEX IF NOT EXISTS idx_commercial_transitions_lead ON commercial_lead_transitions(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_integration_events_lead ON commercial_integration_events(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_integration_events_channel ON commercial_integration_events(channel);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_stage_requirements_key
        ON commercial_stage_requirements(stage, requirement_key, COALESCE(profile_key, 'global'));
      CREATE INDEX IF NOT EXISTS idx_commercial_stage_requirements_stage
        ON commercial_stage_requirements(stage);
      CREATE INDEX IF NOT EXISTS idx_commercial_lead_requirement_status_lead
        ON commercial_lead_requirement_status(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_assets_lead_stage
        ON commercial_assets(lead_id, stage);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_template_versions_template_version
        ON commercial_template_versions(template_id, version);
      CREATE INDEX IF NOT EXISTS idx_commercial_template_bindings_stage_channel
        ON commercial_template_bindings(stage, channel);
      CREATE INDEX IF NOT EXISTS idx_commercial_template_bindings_profile
        ON commercial_template_bindings(profile_key);
      CREATE INDEX IF NOT EXISTS idx_commercial_scheduling_tokens_lead
        ON commercial_scheduling_tokens(lead_id, expires_at);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_tokens_hash
        ON commercial_scheduling_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_commercial_scheduling_invites_lead
        ON commercial_scheduling_invites(lead_id, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_invites_hash
        ON commercial_scheduling_invites(token_hash);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_invites_redirect_hash
        ON commercial_scheduling_invites(redirect_token_hash)
        WHERE redirect_token_hash IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_commercial_scheduling_quick_tokens_lead
        ON commercial_scheduling_quick_tokens(lead_id, slot_start, expires_at);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_quick_tokens_hash
        ON commercial_scheduling_quick_tokens(token_hash);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_whatsapp_inbound_provider_message
        ON commercial_whatsapp_inbound_events(provider_message_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_whatsapp_inbound_from_phone
        ON commercial_whatsapp_inbound_events(from_phone, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_commercial_calendar_configs_responsavel
        ON commercial_calendar_configs(responsavel_key);
      CREATE INDEX IF NOT EXISTS idx_commercial_reconciliation_status
        ON commercial_scheduling_reconciliation_queue(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_commercial_reconciliation_event
        ON commercial_scheduling_reconciliation_queue(google_event_id, calendar_config_id);
`;
