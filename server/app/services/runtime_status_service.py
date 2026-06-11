from __future__ import annotations

import os
import platform
import shutil
import subprocess
from pathlib import Path

from app.schemas import (
    CodeStatusResponse,
    EnvironmentStatusResponse,
    EnvironmentSummaryResponse,
    KnowledgeAssetSummary,
    ModelProviderResponse,
    RuntimeServiceStatus,
    RuntimeVersionInfo,
)

WORKSPACE_ROOT = Path('/workspace')
CLIENT_ROOT = WORKSPACE_ROOT / 'client'
SERVER_ROOT = WORKSPACE_ROOT / 'server'
DOCS_ROOT = WORKSPACE_ROOT / 'docs'
RULES_ROOT = SERVER_ROOT / 'rules'


class RuntimeStatusService:
    def _run_command(self, command: list[str], cwd: Path | None = None, timeout: int = 5) -> tuple[bool, str]:
        try:
            result = subprocess.run(
                command,
                cwd=str(cwd) if cwd else None,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False, ''

        output = (result.stdout or result.stderr).strip()
        return result.returncode == 0, output

    def _version_of(self, command: list[str]) -> str:
        ok, output = self._run_command(command)
        if not ok or not output:
            return '未检测到'
        return output.splitlines()[0]

    def _git_branch(self) -> str:
        ok, output = self._run_command(['git', 'branch', '--show-current'], cwd=WORKSPACE_ROOT)
        return output if ok and output else '未知分支'

    def _git_commit(self) -> str:
        ok, output = self._run_command(['git', 'rev-parse', '--short', 'HEAD'], cwd=WORKSPACE_ROOT)
        return output if ok and output else '未知提交'

    def _git_status_lines(self) -> list[str]:
        ok, output = self._run_command(['git', 'status', '--short'], cwd=WORKSPACE_ROOT)
        if not ok or not output:
            return []
        return [line for line in output.splitlines() if line.strip()]

    def _count_files(self, path: Path, pattern: str) -> int:
        if not path.exists():
            return 0
        return len(list(path.glob(pattern)))

    def _detect_ollama(self) -> ModelProviderResponse:
        executable = shutil.which('ollama')
        if not executable:
            return ModelProviderResponse(
                provider='Ollama',
                endpoint='未安装',
                model='-',
                status='missing',
                default=False,
            )

        ok, output = self._run_command(['ollama', 'list'], cwd=WORKSPACE_ROOT, timeout=8)
        if ok:
            lines = [line for line in output.splitlines() if line.strip()]
            model = '-'
            if len(lines) > 1:
                model = lines[1].split()[0]
            return ModelProviderResponse(
                provider='Ollama',
                endpoint=executable,
                model=model,
                status='online',
                default=False,
            )

        return ModelProviderResponse(
            provider='Ollama',
            endpoint=executable,
            model='-',
            status='installed',
            default=False,
        )

    def _detect_openai_compatible(self) -> ModelProviderResponse:
        base_url = os.getenv('OPENAI_BASE_URL') or os.getenv('OPENAI_API_BASE')
        api_key = os.getenv('OPENAI_API_KEY')
        configured = bool(base_url or api_key)
        return ModelProviderResponse(
            provider='OpenAI-Compatible',
            endpoint=base_url or '未配置',
            model=os.getenv('OPENAI_MODEL', '-'),
            status='configured' if configured else 'not_configured',
            default=False,
        )

    def _detect_deepseek(self) -> ModelProviderResponse:
        base_url = os.getenv('DEEPSEEK_BASE_URL') or os.getenv('DEEPSEEK_API_BASE')
        api_key = os.getenv('DEEPSEEK_API_KEY')
        configured = bool(base_url or api_key)
        return ModelProviderResponse(
            provider='DeepSeek-Compatible',
            endpoint=base_url or '未配置',
            model=os.getenv('DEEPSEEK_MODEL', '-'),
            status='configured' if configured else 'not_configured',
            default=False,
        )

    def _detect_local_provider(self) -> ModelProviderResponse:
        model_config = SERVER_ROOT / 'config' / 'model_providers.example.yaml'
        exists = model_config.exists()
        return ModelProviderResponse(
            provider='本地模型网关',
            endpoint=str(model_config) if exists else '未配置',
            model='由配置文件决定',
            status='configured' if exists else 'not_configured',
            default=True,
        )

    def list_model_providers(self) -> list[ModelProviderResponse]:
        return [
            self._detect_local_provider(),
            self._detect_ollama(),
            self._detect_openai_compatible(),
            self._detect_deepseek(),
        ]

    def environment_status(self) -> EnvironmentStatusResponse:
        versions = RuntimeVersionInfo(
            node=self._version_of(['node', '-v']),
            npm=self._version_of(['npm', '-v']),
            python=self._version_of(['python', '--version']),
            git=self._version_of(['git', '--version']),
        )

        providers = self.list_model_providers()
        services = [
            RuntimeServiceStatus(name='后端服务目录', status='ready' if SERVER_ROOT.exists() else 'missing', detail=str(SERVER_ROOT)),
            RuntimeServiceStatus(name='客户端目录', status='ready' if CLIENT_ROOT.exists() else 'missing', detail=str(CLIENT_ROOT)),
            RuntimeServiceStatus(name='规则库目录', status='ready' if RULES_ROOT.exists() else 'missing', detail=str(RULES_ROOT)),
            RuntimeServiceStatus(name='Ollama', status=providers[1].status, detail=providers[1].endpoint),
        ]

        return EnvironmentStatusResponse(
            platform=platform.platform(),
            workspace=str(WORKSPACE_ROOT),
            branch=self._git_branch(),
            commit=self._git_commit(),
            versions=versions,
            services=services,
        )

    def code_status(self) -> CodeStatusResponse:
        lines = self._git_status_lines()
        changed = [line for line in lines if not line.startswith('??')]
        untracked = [line for line in lines if line.startswith('??')]
        return CodeStatusResponse(
            branch=self._git_branch(),
            commit=self._git_commit(),
            dirty=bool(lines),
            changed_files=len(changed),
            untracked_files=len(untracked),
            client_pages=self._count_files(CLIENT_ROOT / 'src' / 'pages', '*.vue'),
            client_components=self._count_files(CLIENT_ROOT / 'src' / 'components', '*.vue'),
            server_routes=self._count_files(SERVER_ROOT / 'app' / 'api' / 'routes', '*.py'),
            server_tests=self._count_files(SERVER_ROOT / 'tests', 'test_*.py'),
        )

    def knowledge_assets(self) -> list[KnowledgeAssetSummary]:
        return [
            KnowledgeAssetSummary(
                category='GJB 规则文件',
                count=self._count_files(RULES_ROOT / 'gjb', '*.yaml'),
                description='当前仓库中可直接加载的 GJB YAML 规则文件数量。',
            ),
            KnowledgeAssetSummary(
                category='产品与架构文档',
                count=self._count_files(DOCS_ROOT, '**/*.md'),
                description='当前项目内已落地的产品、架构与验收文档数量。',
            ),
            KnowledgeAssetSummary(
                category='前端页面',
                count=self._count_files(CLIENT_ROOT / 'src' / 'pages', '*.vue'),
                description='当前客户端已实现的页面数量，可视为实际可操作功能入口。',
            ),
            KnowledgeAssetSummary(
                category='自动化测试',
                count=self._count_files(SERVER_ROOT / 'tests', 'test_*.py') + self._count_files(CLIENT_ROOT / 'src', '**/*.test.ts'),
                description='当前仓库中的前后端测试文件数量。',
            ),
        ]

    def summary(self) -> EnvironmentSummaryResponse:
        return EnvironmentSummaryResponse(
            environment=self.environment_status(),
            code=self.code_status(),
            modelProviders=self.list_model_providers(),
            knowledgeAssets=self.knowledge_assets(),
        )


runtime_status_service = RuntimeStatusService()
