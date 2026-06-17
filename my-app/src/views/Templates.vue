<template>
  <div class="templates-container">
    <h2>模板与规则管理</h2>
    
    <el-card class="box-card mb-4">
      <template #header>
        <div class="card-header">
          <span>模板列表</span>
          <el-button type="success" size="small" @click="createNewTemplate">添加新模板</el-button>
        </div>
      </template>

      <el-table :data="templates" border style="width: 100%">
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="path" label="DOCX 文件" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.path || '未选择' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="editTemplate(scope.$index)">编辑</el-button>
            <el-button size="small" type="primary" @click="goToGenerate(scope.row.id)">去生成</el-button>
            <el-button size="small" type="danger" @click="deleteTemplate(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingIndex > -1 ? '编辑模板' : '添加模板'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top" v-if="currentTemplate">
        <el-form-item label="模板分类/名称">
          <el-input v-model="currentTemplate.name" placeholder="请输入模板名称，如：需求规格说明书模板" />
        </el-form-item>

        <el-form-item label="DOCX 模板文件">
          <div class="file-selector">
            <el-button type="primary" @click="selectTemplate">选择模板文件</el-button>
            <span class="file-path" v-if="currentTemplate.path">{{ currentTemplate.path }}</span>
            <span class="file-path text-gray" v-else>未选择文件</span>
          </div>
          <div class="tip">请选择包含变量标记（如 {name}, {#items} ... {/items}）的 DOCX 文件</div>
        </el-form-item>

        <el-form-item label="变量含义与示例配置" v-if="currentTemplate.variables && currentTemplate.variables.length > 0">
          <div class="tip mb-2">您可以为每个变量指定含义或示例，AI 在生成时会严格参考这些说明。</div>
          <el-table :data="currentTemplate.variables" border size="small" style="width: 100%">
            <el-table-column prop="name" label="变量名" width="200" />
            <el-table-column label="含义说明与示例 (AI 将参考此内容)">
              <template #default="scope">
                <el-input v-model="scope.row.description" placeholder="例如：描述操作步骤。示例：1.用户点击登录..." />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item label="生成标准/规则">
          <el-input
            v-model="currentTemplate.standardText"
            type="textarea"
            :rows="8"
            placeholder="请输入文档生成的整体标准或通用规则。例如：&#10;1. 语言必须使用专业的书面语&#10;2. 功能点描述必须包含目的和预期结果&#10;3. 所有数值需要加粗"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTemplateConfig" :loading="saving">保存模板</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { getSettings, saveSettings, selectTemplateFile, saveTemplateBuffer } from '../utils/bridge'

const router = useRouter()
const templates = ref<any[]>([])

const dialogVisible = ref(false)
const saving = ref(false)
const editingIndex = ref(-1)
const currentTemplate = ref<any>(null)

onMounted(async () => {
  await loadTemplates()
})

const loadTemplates = async () => {
  try {
    const settings = await getSettings()
    if (settings) {
      if (settings.templates && Array.isArray(settings.templates)) {
        templates.value = settings.templates
      } else {
        // 兼容老版本数据，迁移到新格式
        if (settings.templatePath || settings.templateName) {
          templates.value = [{
            id: 'tpl_' + Date.now(),
            name: settings.templateName || '默认模板',
            path: settings.templatePath,
            standardText: settings.standardText || '',
            variables: (settings.templateVariables || []).map((v: any) => typeof v === 'string' ? { name: v, description: '' } : v)
          }]
          // 顺便保存一下迁移后的结构
          settings.templates = templates.value
          await saveSettings(settings)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load settings', error)
  }
}

const createNewTemplate = () => {
  editingIndex.value = -1
  currentTemplate.value = {
    id: 'tpl_' + Date.now(),
    name: '新模板',
    path: '',
    standardText: '',
    variables: []
  }
  dialogVisible.value = true
}

const editTemplate = (index: number) => {
  editingIndex.value = index
  currentTemplate.value = JSON.parse(JSON.stringify(templates.value[index]))
  dialogVisible.value = true
}

const deleteTemplate = (index: number) => {
  ElMessageBox.confirm('确定要删除这个模板吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    templates.value.splice(index, 1)
    const settings = await getSettings()
    settings.templates = templates.value
    await saveSettings(settings)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const selectTemplate = async () => {
  const result = await selectTemplateFile()
  if (result) {
    currentTemplate.value.path = result.path
    if (currentTemplate.value.name === '新模板') {
      currentTemplate.value.name = result.name.replace('.docx', '')
    }
    await extractVariables(result.buffer)
    // 对于纯 Web 端，我们需要为每个模板保存独立的 buffer
    // 修改 bridge.ts 的 saveTemplateBuffer 支持 id，但为了向后兼容，我们将路径作为 key
    await saveTemplateBuffer(result.buffer, result.path)
  }
}

const extractVariables = async (buffer: ArrayBuffer) => {
  try {
    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })
    
    const text = doc.getFullText()
    
    if (text.includes('{%') || text.includes('{{')) {
      ElMessage.warning({
        message: '检测到 Jinja2 语法 (如 {% for %})，本系统使用 docxtemplater 引擎，请修改为 {#loop} 语法！',
        duration: 5000
      })
    }

    const regex = /\{([a-zA-Z0-9_#\/]+)\}/g
    const matches = new Set<string>()
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1])
    }
    
    const newVars = Array.from(matches)
    currentTemplate.value.variables = newVars.map(name => {
      const existing = currentTemplate.value.variables.find((v: any) => v.name === name)
      return { name, description: existing ? existing.description : '' }
    })

    if (currentTemplate.value.variables.length === 0) {
      ElMessage.warning('未在模板中解析到合法变量，请确认变量被单大括号 {} 包裹。')
    } else {
      ElMessage.success('模板解析成功！')
    }
  } catch (error: any) {
    console.error('Error extracting variables', error)
    ElMessage.error('无法解析模板文件中的变量')
  }
}

const saveTemplateConfig = async () => {
  if (!currentTemplate.value.name) {
    return ElMessage.warning('请输入模板名称')
  }
  saving.value = true
  try {
    if (editingIndex.value > -1) {
      templates.value[editingIndex.value] = currentTemplate.value
    } else {
      templates.value.push(currentTemplate.value)
    }
    const settings = await getSettings()
    settings.templates = templates.value
    await saveSettings(settings)
    dialogVisible.value = false
    ElMessage.success('模板配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const goToGenerate = (templateId: string) => {
  router.push({ path: '/generation', query: { templateId } })
}
</script>

<style scoped>
.templates-container {
  max-width: 1000px;
  margin: 0 auto;
}
h2 {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.file-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}
.file-path {
  font-size: 14px;
  word-break: break-all;
}
.text-gray {
  color: #909399;
}
.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}
.mr-2 {
  margin-right: 8px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
