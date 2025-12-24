// 入口文件 - 导入主应用
import { NewtonFractalRenderer } from './main.js'

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    const renderer = new NewtonFractalRenderer();
    await renderer.init();
});