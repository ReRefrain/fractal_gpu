// GPU加速牛顿分形主程序
import { Parser, PRESETS } from './parser.js'

class NewtonFractalRenderer {
    constructor() {
        this.canvas = document.getElementById('fractal-canvas');
        this.gl = null;
        this.program = null;
        this.uniforms = {};
        
        // 渲染参数
        this.center = [0.0, 0.0]; // 复数平面中心
        this.zoom = 1.0; // 缩放级别
        this.maxIterations = 50;
        this.tolerance = 0.001;
        this.functionType = 'polynomial';
        this.coefficients = [1, 0, 0, -1]; // z³ - 1
        this.transConstant = { real: -1, imag: 0 };
        this.colorScheme = 0;
        
        // 交互状态
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.renderTimeout = null;
        this.lastRenderTime = 0;
        
        this.init();
    }
    
    async init() {
        // 初始化WebGL上下文
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            alert('WebGL2不支持！请使用现代浏览器。');
            return;
        }
        
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 创建着色器程序
        await this.createShaderProgram();
        
        if (!this.program) {
            alert('着色器程序创建失败！');
            return;
        }
        
        // 获取uniform位置
        this.getUniformLocations();
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 初始渲染
        this.render();
        
        // 隐藏加载提示
        document.getElementById('loading').style.display = 'none';
        document.getElementById('perf-info').style.display = 'block';
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    async loadShaderSource(url) {
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (error) {
            console.error('加载着色器失败:', error);
            return null;
        }
    }
    
    async createShaderProgram() {
        // 加载片段着色器
        const fragmentShaderSource = await this.loadShaderSource('./shaders/fractal.frag');
        if (!fragmentShaderSource) {
            console.error('无法加载片段着色器');
            return;
        }
        
        // 顶点着色器（全屏三角形）
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // 创建着色器
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        if (!vertexShader || !fragmentShader) {
            console.error('着色器创建失败');
            return;
        }
        
        // 创建程序
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('着色器程序链接失败:', this.gl.getProgramInfoLog(this.program));
            return;
        }
        
        // 使用程序
        this.gl.useProgram(this.program);
        
        // 创建全屏三角形顶点数据
        const positions = new Float32Array([
            -1.0, -1.0,
             3.0, -1.0,
            -1.0,  3.0
        ]);
        
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        // 获取attribute位置
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('着色器编译失败:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    getUniformLocations() {
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            center: this.gl.getUniformLocation(this.program, 'u_center'),
            zoom: this.gl.getUniformLocation(this.program, 'u_zoom'),
            maxIterations: this.gl.getUniformLocation(this.program, 'u_maxIterations'),
            tolerance: this.gl.getUniformLocation(this.program, 'u_tolerance'),
            funcType: this.gl.getUniformLocation(this.program, 'u_funcType'),
            coeffs: this.gl.getUniformLocation(this.program, 'u_coeffs'),
            coeffCount: this.gl.getUniformLocation(this.program, 'u_coeffCount'),
            transConstant: this.gl.getUniformLocation(this.program, 'u_transConstant'),
            colorScheme: this.gl.getUniformLocation(this.program, 'u_colorScheme')
        };
    }
    
    setupEventListeners() {
        // 函数类型切换
        document.getElementById('function-type').addEventListener('change', (e) => {
            this.functionType = e.target.value;
            this.toggleFunctionSections();
            this.scheduleRender();
        });
        
        // 系数输入
        document.getElementById('coefficients').addEventListener('input', (e) => {
            try {
                this.coefficients = Parser.parsePolynomial(e.target.value);
                this.updateFormulaDisplay();
                this.scheduleRender();
            } catch (error) {
                console.warn('系数解析失败:', error.message);
            }
        });
        
        // 超越函数常数输入
        document.getElementById('trans-constant').addEventListener('input', (e) => {
            try {
                this.transConstant = Parser.parseTranscendental(e.target.value);
                this.scheduleRender();
            } catch (error) {
                console.warn('常数解析失败:', error.message);
            }
        });
        
        // 渲染参数
        document.getElementById('max-iterations').addEventListener('input', (e) => {
            this.maxIterations = parseInt(e.target.value) || 50;
            this.scheduleRender();
        });
        
        document.getElementById('tolerance').addEventListener('input', (e) => {
            this.tolerance = parseFloat(e.target.value) || 0.001;
            this.scheduleRender();
        });
        
        document.getElementById('color-scheme').addEventListener('change', (e) => {
            this.colorScheme = parseInt(e.target.value);
            this.scheduleRender();
        });
        
        // 预设按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const presetKey = e.target.dataset.preset;
                this.loadPreset(presetKey);
            });
        });
        
        // 渲染按钮
        document.getElementById('render-btn').addEventListener('click', () => {
            this.render();
        });
        
        // 导出按钮
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportImage();
        });
        
        // 鼠标交互
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
        this.canvas.addEventListener('wheel', (e) => this.zoom(e));
        
        // 触摸支持
        this.canvas.addEventListener('touchstart', (e) => this.startTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.touchMove(e));
        this.canvas.addEventListener('touchend', () => this.endDrag());
        
        // 初始化公式显示
        this.updateFormulaDisplay();
    }
    
    toggleFunctionSections() {
        const polySection = document.getElementById('polynomial-section');
        const transSection = document.getElementById('transcendental-section');
        
        if (this.functionType === 'polynomial') {
            polySection.style.display = 'block';
            transSection.style.display = 'none';
        } else {
            polySection.style.display = 'none';
            transSection.style.display = 'block';
        }
    }
    
    updateFormulaDisplay() {
        const display = document.getElementById('formula-display');
        if (this.functionType === 'polynomial') {
            display.innerHTML = `f(z) = ${Parser.coeffsToFormula(this.coefficients)}`;
        } else {
            const funcNames = { sin: 'sin(z)', cos: 'cos(z)', exp: 'e^z', cosh: 'cosh(z)' };
            const sign = this.transConstant.real >= 0 ? '+' : '';
            display.innerHTML = `f(z) = ${funcNames[this.functionType]} ${sign} ${this.transConstant.real}`;
        }
    }
    
    loadPreset(presetKey) {
        const preset = PRESETS[presetKey];
        if (!preset) return;
        
        if (preset.type === 'polynomial') {
            document.getElementById('function-type').value = 'polynomial';
            document.getElementById('coefficients').value = preset.coefficients;
            this.coefficients = Parser.parsePolynomial(preset.coefficients);
        } else {
            document.getElementById('function-type').value = preset.type;
            document.getElementById('trans-constant').value = preset.constant;
            this.transConstant = Parser.parseTranscendental(preset.constant);
        }
        
        this.functionType = preset.type;
        this.toggleFunctionSections();
        this.updateFormulaDisplay();
        this.render();
    }
    
    scheduleRender() {
        // 防抖渲染，避免频繁更新
        clearTimeout(this.renderTimeout);
        this.renderTimeout = setTimeout(() => {
            this.render();
        }, 300);
    }
    
    render() {
        if (!this.gl || !this.program) return;
        
        const startTime = performance.now();
        
        // 设置uniform变量
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniforms.center, this.center[0], this.center[1]);
        this.gl.uniform1f(this.uniforms.zoom, this.zoom);
        this.gl.uniform1i(this.uniforms.maxIterations, this.maxIterations);
        this.gl.uniform1f(this.uniforms.tolerance, this.tolerance);
        
        // 函数类型
        const funcTypeMap = { 'polynomial': 0, 'sin': 1, 'cos': 2, 'exp': 3, 'cosh': 4 };
        this.gl.uniform1i(this.uniforms.funcType, funcTypeMap[this.functionType]);
        
        // 多项式系数
        if (this.functionType === 'polynomial') {
            const coeffArray = new Float32Array(20);
            coeffArray.set(this.coefficients);
            this.gl.uniform1fv(this.uniforms.coeffs, coeffArray);
            this.gl.uniform1i(this.uniforms.coeffCount, this.coefficients.length);
        }
        
        // 超越函数常数
        this.gl.uniform2f(this.uniforms.transConstant, this.transConstant.real, this.transConstant.imag);
        
        // 颜色方案
        this.gl.uniform1i(this.uniforms.colorScheme, this.colorScheme);
        
        // 渲染
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
        
        // 更新性能信息
        const renderTime = performance.now() - startTime;
        this.lastRenderTime = renderTime;
        document.getElementById('render-time').textContent = renderTime.toFixed(1);
        document.getElementById('fps').textContent = Math.round(1000 / renderTime);
    }
    
    // 鼠标交互
    startDrag(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMousePos.x;
        const deltaY = e.clientY - this.lastMousePos.y;
        
        // 转换为复数平面坐标
        const scale = 1.0 / (this.zoom * this.canvas.height);
        this.center[0] -= deltaX * scale;
        this.center[1] += deltaY * scale; // Y轴反转
        
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.render();
    }
    
    endDrag() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    zoom(e) {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
        this.zoom *= zoomFactor;
        
        // 限制缩放范围
        this.zoom = Math.max(0.01, Math.min(10000, this.zoom));
        
        this.render();
    }
    
    // 触摸支持
    startTouch(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            this.startDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        }
    }
    
    touchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            this.drag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        }
    }
    
    // 导出图像
    exportImage() {
        const link = document.createElement('a');
        link.download = `newton-fractal-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    const renderer = new NewtonFractalRenderer();
    await renderer.init();
});