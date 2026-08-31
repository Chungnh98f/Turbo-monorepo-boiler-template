# Local dev orchestration: infra in containers, app dev servers as native
# processes so Vite/tsx keep their own fast file watching and HMR.
#
#   tilt up     bring everything up (UI at http://localhost:10350)
#   tilt down   stop and remove the containers

docker_compose('./infra/dev/docker-compose.yml')

dc_resource('postgres', labels=['infra'])
dc_resource('redis', labels=['infra'])

local_resource(
    'install',
    cmd='pnpm install --frozen-lockfile',
    deps=['pnpm-lock.yaml', 'pnpm-workspace.yaml'],
    labels=['setup'],
)

local_resource(
    'api',
    serve_cmd='pnpm --filter @repo/api dev',
    resource_deps=['install', 'postgres', 'redis'],
    readiness_probe=probe(
        period_secs=5,
        http_get=http_get_action(port=3001, path='/healthz'),
    ),
    links=[link('http://localhost:3001/healthz', 'healthz')],
    labels=['apps'],
)

local_resource(
    'web',
    serve_cmd='pnpm --filter @repo/web dev',
    resource_deps=['api'],
    links=[link('http://localhost:5173', 'web')],
    labels=['apps'],
)

# Manual trigger: a button in the Tilt UI rather than noise on every keystroke.
local_resource(
    'check',
    cmd='pnpm turbo lint typecheck test',
    auto_init=False,
    trigger_mode=TRIGGER_MODE_MANUAL,
    labels=['checks'],
)
