GJB_RULES = {
    "requirements": {
        "required_sections": ["1. 范围", "2. 引用文件", "3. 需求概述", "4. 功能需求"],
        "forbidden_terms": ["数据库表单", "随便", "差不多"],
    },
    "design": {
        "required_sections": ["1. 系统概述", "2. 模块设计", "3. 接口设计", "4. 异常处理"],
        "forbidden_terms": ["数据库表单", "临时方案"],
    },
    "testing": {
        "required_sections": ["1. 测试范围", "2. 测试环境", "3. 测试项", "4. 判定准则"],
        "forbidden_terms": ["大概通过", "人工看看"],
    },
    "manual": {
        "required_sections": ["1. 产品简介", "2. 操作准备", "3. 操作步骤", "4. 注意事项"],
        "forbidden_terms": ["随便点击", "大概"],
    },
}

TERMS = ["任务规划", "告警中心", "接口控制器", "审查批次", "术语基线"]

MODEL_PROVIDERS = [
    {
        "provider": "本地 32B 主模型（示例）",
        "endpoint": "http://127.0.0.1:11434/v1",
        "model": "mil-doc-32b",
        "status": "mock",
        "default": True,
    },
    {
        "provider": "Ollama（示例接入）",
        "endpoint": "http://127.0.0.1:11434/v1",
        "model": "qwen2.5:14b",
        "status": "mock",
        "default": False,
    },
    {
        "provider": "DeepSeek-Compatible（示例接入）",
        "endpoint": "http://127.0.0.1:8001/v1",
        "model": "deepseek-r1-distill",
        "status": "mock",
        "default": False,
    },
]

KNOWLEDGE_ASSETS = [
    {"category": "GJB 规则", "count": 128, "description": "覆盖章节结构、编号、术语、图表和一致性规则。"},
    {"category": "文档模板", "count": 24, "description": "需求、设计、测试和用户手册模板的骨架与样式约束。"},
    {"category": "历史文档", "count": 312, "description": "来自多个项目阶段的设计与测试说明书。"},
    {"category": "审查意见", "count": 486, "description": "积累高频问题、整改建议与专家复核意见。"},
]
