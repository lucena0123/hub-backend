# Ops Validation Report
- Generated at: 2026-02-17 15:26:52
- Distro: Ubuntu

## Docker Containers

- bpmn-postgres: Up 31 minutes (healthy)
- bpmn-redis: Up 31 minutes (healthy)

## Smoke

- PASS 200 http://localhost:3001/health
- PASS 200 http://localhost:3000/
- PASS 200 http://localhost:3000/login
- PASS 200 http://localhost:3000/performance
- PASS 200 http://localhost:3000/optimization/board
- PASS 200 http://localhost:3000/clients
- AUTH PASS (register): smoke1030273504@local.test
- PASS 200 http://localhost:3001/api/optimization/audit?limit=5
- PASS 200 http://localhost:3001/api/optimization/audit/summary?sinceHours=24
- 
- SMOKE RESULT: PASS

## Conclusion

- PASS: stack e rotas criticas validadas.
