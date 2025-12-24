// 多项式和超越函数解析器
class Parser {
    // 解析多项式系数字符串
    static parsePolynomial(coeffStr) {
        if (!coeffStr || coeffStr.trim() === '') {
            throw new Error('系数字符串不能为空');
        }
        
        const parts = coeffStr.split(',');
        const coeffs = [];
        
        for (let part of parts) {
            part = part.trim();
            if (part === '') continue;
            
            const num = parseFloat(part);
            if (isNaN(num)) {
                throw new Error(`无效的系数: ${part}`);
            }
            coeffs.push(num);
        }
        
        if (coeffs.length === 0) {
            throw new Error('未找到有效系数');
        }
        
        return coeffs;
    }
    
    // 将系数数组转换为公式字符串
    static coeffsToFormula(coeffs) {
        if (!coeffs || coeffs.length === 0) return '0';
        
        const terms = [];
        const n = coeffs.length - 1; // 最高次幂
        
        for (let i = 0; i < coeffs.length; i++) {
            const coeff = coeffs[i];
            const power = n - i;
            
            if (coeff === 0) continue;
            
            let term = '';
            
            // 系数
            if (coeff !== 1 || power === 0) {
                term += coeff.toString();
            }
            
            // 变量和幂
            if (power > 0) {
                term += 'z';
                if (power > 1) {
                    term += '<sup>' + power + '</sup>';
                }
            }
            
            terms.push(term);
        }
        
        if (terms.length === 0) return '0';
        
        return terms.join(' + ').replace(/\+ \-/g, '- ');
    }
    
    // 解析超越函数参数
    static parseTranscendental(constantStr) {
        if (!constantStr || constantStr.trim() === '') {
            return { real: 0, imag: 0 };
        }
        
        const num = parseFloat(constantStr.trim());
        if (isNaN(num)) {
            throw new Error(`无效的常数: ${constantStr}`);
        }
        
        return { real: num, imag: 0 };
    }
    
    // 验证输入
    static validateInput(type, value) {
        try {
            if (type === 'polynomial') {
                this.parsePolynomial(value);
            } else {
                this.parseTranscendental(value);
            }
            return { valid: true, error: null };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

// 预设分形配置
const PRESETS = {
    'z3-1': {
        type: 'polynomial',
        coefficients: '1,0,0,-1',
        formula: 'z³ - 1'
    },
    'z4-1': {
        type: 'polynomial',
        coefficients: '1,0,0,0,-1',
        formula: 'z⁴ - 1'
    },
    'z5-1': {
        type: 'polynomial',
        coefficients: '1,0,0,0,0,-1',
        formula: 'z⁵ - 1'
    },
    'z6-1': {
        type: 'polynomial',
        coefficients: '1,0,0,0,0,0,-1',
        formula: 'z⁶ - 1'
    },
    'sinz-1': {
        type: 'sin',
        constant: '-1',
        formula: 'sin(z) - 1'
    },
    'cosz-1': {
        type: 'cos',
        constant: '-1',
        formula: 'cos(z) - 1'
    },
    'expz-1': {
        type: 'exp',
        constant: '-1',
        formula: 'e^z - 1'
    },
    'coshz-1': {
        type: 'cosh',
        constant: '-1',
        formula: 'cosh(z) - 1'
    }
};

// ES模块导出
export { Parser, PRESETS };