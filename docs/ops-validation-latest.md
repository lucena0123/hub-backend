# Ops Validation Report
- Generated at: 2026-02-17 22:02:02
- Distro: Ubuntu

## Docker Containers

- bpmn-postgres: Up 7 hours (healthy)
- bpmn-redis: Up 7 hours (healthy)

## Smoke

- PASS 200 http://localhost:3001/health
- PASS 200 http://localhost:3000/
- PASS 200 http://localhost:3000/login
- PASS 200 http://localhost:3000/performance
- PASS 200 http://localhost:3000/optimization/board
- PASS 200 http://localhost:3000/clients
- AUTH PASS (register): smoke110075936@local.test
- PASS 200 http://localhost:3001/api/optimization/audit?limit=5
- PASS 200 http://localhost:3001/api/optimization/audit/summary?sinceHours=24
- 
- SMOKE RESULT: PASS

## Conclusion

- PASS: stack e rotas criticas validadas.
