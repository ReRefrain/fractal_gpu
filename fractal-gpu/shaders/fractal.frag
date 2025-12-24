#version 300 es

precision highp float;

// 复数运算函数
vec2 cadd(vec2 a, vec2 b) {
    return a + b;
}

vec2 csub(vec2 a, vec2 b) {
    return a - b;
}

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    float denom = b.x * b.x + b.y * b.y;
    return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / denom;
}

vec2 cexp(vec2 z) {
    float exp_x = exp(z.x);
    return vec2(exp_x * cos(z.y), exp_x * sin(z.y));
}

vec2 csin(vec2 z) {
    return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

vec2 ccos(vec2 z) {
    return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

vec2 ccosh(vec2 z) {
    return vec2(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y));
}

vec2 csinh(vec2 z) {
    return vec2(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y));
}

// 多项式求值
vec2 evaluatePolynomial(vec2 z, out vec2 derivative) {
    vec2 f = vec2(0.0, 0.0);
    vec2 df = vec2(0.0, 0.0);
    vec2 pow_z = vec2(1.0, 0.0); // z^0 = 1
    
    for (int i = 0; i < 20; i++) {
        if (i >= u_coeffCount) break;
        
        // f(z) += coeff[i] * z^i
        vec2 term = cmul(vec2(u_coeffs[i], 0.0), pow_z);
        f = cadd(f, term);
        
        // f'(z) += i * coeff[i] * z^(i-1)
        if (i > 0) {
            vec2 dterm = cmul(vec2(float(i) * u_coeffs[i], 0.0), pow_z);
            df = cadd(df, dterm);
        }
        
        pow_z = cmul(pow_z, z);
    }
    
    derivative = df;
    return f;
}

// 超越函数求值
vec2 evaluateTranscendental(vec2 z, out vec2 derivative) {
    vec2 f, df;
    
    if (u_funcType == 1) { // sin(z) + c
        f = cadd(csin(z), u_transConstant);
        df = ccos(z);
    } else if (u_funcType == 2) { // cos(z) + c
        f = cadd(ccos(z), u_transConstant);
        df = cneg(csin(z));
    } else if (u_funcType == 3) { // exp(z) + c
        f = cadd(cexp(z), u_transConstant);
        df = cexp(z);
    } else if (u_funcType == 4) { // cosh(z) + c
        f = cadd(ccosh(z), u_transConstant);
        df = csinh(z);
    } else {
        f = z;
        df = vec2(1.0, 0.0);
    }
    
    derivative = df;
    return f;
}

// HSV转RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// 颜色方案
vec3 getColor(int scheme, float t, int iteration) {
    if (scheme == 0) { // 经典彩虹
        return hsv2rgb(vec3(t, 0.8, 1.0));
    } else if (scheme == 1) { // 蓝色渐变
        return mix(vec3(0.0, 0.3, 1.0), vec3(0.0, 1.0, 1.0), t);
    } else if (scheme == 2) { // 火焰红
        return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), t);
    } else { // 绿色森林
        return mix(vec3(0.0, 0.5, 0.0), vec3(0.0, 1.0, 0.5), t);
    }
}

// Uniform变量
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_maxIterations;
uniform float u_tolerance;
uniform int u_funcType; // 0: polynomial, 1: sin, 2: cos, 3: exp, 4: cosh
uniform float u_coeffs[20];
uniform int u_coeffCount;
uniform vec2 u_transConstant;
uniform int u_colorScheme;

// 输出
out vec4 fragColor;

void main() {
    // 将像素坐标映射到复数平面
    vec2 pixel = gl_FragCoord.xy;
    vec2 uv = (pixel - u_resolution * 0.5) / u_resolution.y;
    vec2 z = u_center + uv / u_zoom;
    
    // 牛顿迭代
    int iteration = 0;
    float finalDistance = 0.0;
    
    for (int i = 0; i < 200; i++) {
        if (i >= u_maxIterations) break;
        
        vec2 f, df;
        
        if (u_funcType == 0) {
            f = evaluatePolynomial(z, df);
        } else {
            f = evaluateTranscendental(z, df);
        }
        
        // 检查是否收敛
        float dist = length(f);
        if (dist < u_tolerance) {
            finalDistance = dist;
            break;
        }
        
        // 牛顿步: z_{n+1} = z_n - f(z_n)/f'(z_n)
        if (length(df) > 0.0) {
            vec2 delta = cdiv(f, df);
            z = csub(z, delta);
        }
        
        iteration++;
    }
    
    // 着色
    float t = float(iteration) / float(u_maxIterations);
    vec3 color;
    
    if (iteration == u_maxIterations) {
        // 未收敛 - 黑色
        color = vec3(0.0, 0.0, 0.0);
    } else {
        // 根据迭代次数和最终距离着色
        float smoothed = float(iteration) - log2(log(finalDistance) / log(u_tolerance));
        t = smoothed / float(u_maxIterations);
        t = clamp(t, 0.0, 1.0);
        
        color = getColor(u_colorScheme, t, iteration);
        
        // 添加一些阴影效果
        color *= (1.0 - 0.3 * t);
    }
    
    fragColor = vec4(color, 1.0);
}