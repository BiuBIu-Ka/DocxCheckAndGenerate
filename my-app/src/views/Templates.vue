<template>
  <div class="templates-container">
    <h2>模板与规则</h2>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>文档模板配置</span>
        </div>
      </template>
      <el-form label-position="top">
        <el-form-item label="DOCX 模板文件">
          <div class="file-selector">
            <el-button type="primary" @click="selectTemplate">选择模板文件</el-button>
            <span class="file-path" v-if="templateName">{{ templateName }}</span>
            <span class="file-path text-gray" v-else>未选择文件</span>
          </div>
          <div class="tip">请选择包含变量标记（如 {name}, {#items} ... {/items}）的 DOCX 文件</div>
        </el-form-item>

        <el-form-item label="变量含义与示例配置" v-if="templateVariables.length > 0">
          <div class="tip mb-2">您可以为每个变量指定含义或示例，AI 在生成时会严格参考这些说明。</div>
          <el-table :data="templateVariables" border size="small" style="width: 100%">
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
            v-model="standardText"
            type="textarea"
            :rows="8"
            placeholder="请输入文档生成的整体标准或通用规则。例如：&#10;1. 语言必须使用专业的书面语&#10;2. 功能点描述必须包含目的和预期结果&#10;3. 所有数值需要加粗"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="success" @click="saveTemplateConfig" :loading="saving">保存模板配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { getSettings, saveSettings, selectTemplateFile, saveTemplateBuffer } from '../utils/bridge'

const templatePath = ref('')
const templateName = ref('')
const standardText = ref('')
const templateVariables = ref<{name: string, description: string}[]>([])
const saving = ref(false)

onMounted(async () => {
  try {
    const settings = await getSettings()
    if (settings) {
      templatePath.value = settings.templatePath || ''
      templateName.value = settings.templateName || templatePath.value || ''
      standardText.value = settings.standardText || ''
      
      // 兼容旧的 string[] 数据结构，转换为新的对象数组
      if (settings.templateVariables) {
        templateVariables.value = settings.templateVariables.map((v: any) => {
          return typeof v === 'string' ? { name: v, description: '' } : v
        })
      }
    }
  } catch (error) {
    console.error('Failed to load settings', error)
  }
})

const selectTemplate = async () => {
  const result = await selectTemplateFile()
  if (result) {
    templatePath.value = result.path
    templateName.value = result.name
    await extractVariables(result.buffer)
    await saveTemplateBuffer(result.buffer)
  }
}

const extractVariables = async (buffer: ArrayBuffer) => {
  try {
    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })
    
    // Attempt to extract tags
    const text = doc.getFullText()
    
    // 语法兼容性提示
    if (text.includes('{%') || text.includes('{{')) {
      ElMessage.warning({
        message: '检测到 Jinja2 语法 (如 {% for %})，本系统使用 docxtemplater 引擎，请修改为 {#loop} 语法！',
        duration: 5000
      })
    }

    // docxtemplater tags format is {tag} or {#loop} {/loop}
    const regex = /\{([a-zA-Z0-9_#\/]+)\}/g
    const matches = new Set<string>()
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1])
    }
    
    // 保留已有的描述信息
    const newVars = Array.from(matches)
    templateVariables.value = newVars.map(name => {
      const existing = templateVariables.value.find(v => v.name === name)
      return { name, description: existing ? existing.description : '' }
    })

    if (templateVariables.value.length === 0) {
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
  saving.value = true
  try {
    const settings = await getSettings()
    await saveSettings({
      ...settings,
      templatePath: templatePath.value,
      templateName: templateName.value,
      standardText: standardText.value,
      templateVariables: templateVariables.value
    })
    ElMessage.success('模板配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.templates-container {
  max-width: 800px;
  margin: 0 auto;
}
h2 {
  margin-bottom: 20px;
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
</style>
