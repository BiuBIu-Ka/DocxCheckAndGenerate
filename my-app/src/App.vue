<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <div class="logo">文档生成系统</div>
      <el-menu
        :default-active="route.path"
        router
        class="el-menu-vertical"
      >
        <el-menu-item index="/generation">
          <el-icon><Document /></el-icon>
          <span>文档生成</span>
        </el-menu-item>
        <el-menu-item index="/templates">
          <el-icon><Files /></el-icon>
          <span>模板与规则</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>模型配置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
}
.aside {
  background-color: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
  border-bottom: 1px solid #dcdfe6;
}
.el-menu-vertical {
  border-right: none;
  flex: 1;
}
.main-content {
  padding: 20px;
  background-color: #ffffff;
  overflow-y: auto;
}
</style>
