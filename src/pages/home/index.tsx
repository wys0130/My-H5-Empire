import React, { useState, useEffect } from 'react';
import { history } from 'umi';
import { TERMS_TEXT, PRIVACY_TEXT } from './legalText';

export default function HomePage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  // 交互状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [needLoginVerify, setNeedLoginVerify] = useState(false); // 🌟 登录风控状态
  const [isSendingCode, setIsSendingCode] = useState(false); // 🌟 发送验证码防抖

  const [capsLockOn, setCapsLockOn] = useState(false);
  const [docModal, setDocModal] = useState<'terms' | 'privacy' | null>(null);

  const [pwdStrength, setPwdStrength] = useState({ score: 0, text: '未输入', color: '#e5e7eb' });
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'error' });

  const showNotification = (msg: string, type: 'success' | 'error' = 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  // 🌟 终极优化：本地缓存自动登录 + 身份分流
  useEffect(() => {
    const savedUserStr = localStorage.getItem('coolmall_user');
    if (savedUserStr && (window.location.pathname === '/' || window.location.pathname === '/index')) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        // 如果是管理员，进入 B端财务与资产大盘；否则进入 C端核心生产力引擎
        if (savedUser.role === 'admin') {
          history.push('/dashboard');
        } else {
          history.push('/mall');
        }
      } catch (e) {
        // 解析异常则留在登录页
      }
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 🌟 终极防线：智能扫描密码合法性与强度
  useEffect(() => {
    if (!password) {
      setPwdStrength({ score: 0, text: '未输入', color: '#e5e7eb' });
      return;
    }

    // 拦截 1：检测非法字符
    const hasIllegalChar = /[^\x21-\x7E]/.test(password);
    if (hasIllegalChar) {
      setPwdStrength({ score: -1, text: '❌ 包含非法字符 (空格/中文/全角)', color: '#ef4444' });
      return;
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[`~!@#$%^&*()_\-+=<>?:{}|,. \/]/.test(password);

    // 拦截 2：长度与必须组合
    if (!(hasLower || hasUpper) || !hasNumber || password.length < 6) {
      setPwdStrength({ score: 1, text: '不合规 (需英文+数字且≥6位)', color: '#ef4444' });
    } else if (hasLower && hasUpper && hasNumber && hasSpecial && password.length >= 8) {
      setPwdStrength({ score: 3, text: '高强度：大小写+数字+特殊符', color: '#52c41a' });
    } else {
      setPwdStrength({ score: 2, text: '常规安全', color: '#faad14' });
    }
  }, [password]);

  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  const handleSendCode = async () => {
    const cleanEmail = email.trim();
    setEmail(cleanEmail);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return showNotification('⚠️ 请输入合法的邮箱格式！');

    setIsSendingCode(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      }).then(r => r.json());

      if (res.code === 200) {
        setCountdown(60);
        showNotification('📧 验证码已发送 (请查看后端终端日志)', 'success');
      } else {
        showNotification(res.msg);
      }
    } catch {
      showNotification('网络异常，请确认后端(3000端口)已启动');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    setEmail(cleanEmail);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return showNotification('⚠️ 请输入正确的邮箱');

    if (mode === 'register') {
      if (verifyCode.trim().length !== 6) return showNotification('⚠️ 请输入 6 位有效验证码');
      if (pwdStrength.score < 2) return showNotification('⚠️ 密码强度不合规或包含非法字符');
      if (password !== confirmPassword) return showNotification('⚠️ 两次密码核对不一致');
      if (!isAgreed) return showNotification('⚠️ 请阅读并勾选服务条款');

      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: cleanEmail, password, verifyCode: verifyCode.trim() })
        }).then(r => r.json());

        if (res.code === 200) {
          showNotification('🎉 注册成功！请登录', 'success');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        } else showNotification(res.msg);
      } catch { showNotification('网络请求失败，后端未响应'); } finally { setIsLoading(false); }
    }
    else if (mode === 'login') {
      if (!password) return showNotification('⚠️ 请输入密码');
      if (needLoginVerify && verifyCode.trim().length !== 6) return showNotification('⚠️ 请输入 6 位解锁验证码');

      setIsLoading(true);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanEmail, password, verifyCode: verifyCode.trim() })
        }).then(r => r.json());

        if (res.code === 200) {
          localStorage.setItem('coolmall_user', JSON.stringify(res.data));

          // 🌟 终极优化：点击登录后的身份分流
          if (res.data.role === 'admin') {
            history.push('/dashboard');
          } else {
            history.push('/mall');
          }
        }
        else if (res.code === 403 && res.needCaptcha) {
          setNeedLoginVerify(true);
          showNotification(res.msg);
        }
        else {
          showNotification(res.msg);
        }
      } catch { showNotification('登录异常，网络断开'); } finally { setIsLoading(false); }
    }
  };

  const EyeIcon = ({ show, toggle }: { show: boolean, toggle: () => void }) => (
    <div onClick={toggle} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', height: '100%' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
        {show ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        )}
      </svg>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 15px', backgroundColor: '#f3f5f7', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>

      {toast.show && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#f6ffed' : '#fff1f0', border: `1px solid ${toast.type === 'success' ? '#b7eb8f' : '#ffccc7'}`, padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 9999 }}>
          <span style={{ color: toast.type === 'success' ? '#52c41a' : '#ff4d4f', fontWeight: 'bold', fontSize: '14px' }}>{toast.msg}</span>
        </div>
      )}

      <div style={{ background: '#fff', padding: '30px 35px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', width: '100%', maxWidth: '400px', margin: 'auto', boxSizing: 'border-box' }}>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src={require('@/assets/logo.png')} alt="Logo" style={{ width: '160px', height: 'auto', objectFit: 'contain', marginBottom: '15px' }} />
          <h2 style={{ margin: '0', color: '#1a1a1a', fontSize: '22px', fontWeight: 'bold' }}>
            {mode === 'login' ? '登录酷猫办公' : mode === 'register' ? '创建开发者账号' : '重置密码中心'}
          </h2>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>请填写登录邮箱 Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        {(mode === 'register' || mode === 'forgot' || (mode === 'login' && needLoginVerify)) && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>
              {needLoginVerify ? '账户已锁定，请获取验证码解锁' : '邮箱验证码'}
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="6位数字" maxLength={6} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
              <button onClick={handleSendCode} disabled={countdown > 0 || isSendingCode} style={{ width: '110px', background: (countdown > 0 || isSendingCode) ? '#f3f4f6' : '#000', color: (countdown > 0 || isSendingCode) ? '#9ca3af' : '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: (countdown > 0 || isSendingCode) ? 'not-allowed' : 'pointer' }}>
                {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s 重发` : '获取验证码'}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>密码 Password</label>
            {capsLockOn && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>⚠️ 大写锁定已开启</span>}
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyUp={checkCapsLock}
              onKeyDown={checkCapsLock}
              placeholder="英文 + 数字组合 (无空格)"
              style={{ width: '100%', padding: '10px 12px', paddingRight: '40px', borderRadius: '8px', border: (capsLockOn || pwdStrength.score === -1) ? '1px solid #ef4444' : '1px solid #d1d5db', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <EyeIcon show={showPassword} toggle={() => setShowPassword(!showPassword)} />
          </div>

          {mode !== 'login' && password && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '2px' }}>
                <div style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: pwdStrength.score >= 1 ? pwdStrength.color : '#e5e7eb' }}></div>
                <div style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: pwdStrength.score >= 2 ? pwdStrength.color : '#e5e7eb' }}></div>
                <div style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: pwdStrength.score >= 3 ? pwdStrength.color : '#e5e7eb' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: pwdStrength.color, fontWeight: pwdStrength.score === -1 ? 'bold' : 'normal' }}>{pwdStrength.text}</span>
            </div>
          )}
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>核对新密码</label>

            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyUp={checkCapsLock}
                onKeyDown={checkCapsLock}
                placeholder="再次输入核对"
                style={{ width: '100%', padding: '10px 12px', paddingRight: '40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
              <EyeIcon show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', fontSize: '12px', color: '#6b7280' }}>
            <input type="checkbox" checked={isAgreed} onChange={e => setIsAgreed(e.target.checked)} style={{ marginTop: '2px', marginRight: '6px' }} id="agree" />
            <label htmlFor="agree" style={{ lineHeight: '1.4' }}>
              同意酷猫出海合规
              <span style={{ color: '#2563eb', cursor: 'pointer', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); setDocModal('terms'); }}>《服务条款》</span>
              与
              <span style={{ color: '#2563eb', cursor: 'pointer', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); setDocModal('privacy'); }}>《隐私政策》</span>
            </label>
          </div>
        )}

        <button onClick={handleSubmit} disabled={isLoading} style={{ width: '100%', padding: '12px', background: isLoading ? '#4b5563' : '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', marginBottom: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          {isLoading ? '核心通信安全加密中...' : mode === 'login' ? '进入核心工作台' : mode === 'register' ? '验证并完成注册' : '确认重置密码'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          {mode === 'login' ? (
            <>
              <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }} onClick={() => setMode('register')}>新用户注册</span>
              <span style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => setMode('forgot')}>忘记密码?</span>
            </>
          ) : (
            <span style={{ color: '#2563eb', cursor: 'pointer', margin: '0 auto', fontWeight: '500' }} onClick={() => setMode('login')}>&larr; 返回邮箱登录</span>
          )}
        </div>
      </div>

      {docModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', maxHeight: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111' }}>{docModal === 'terms' ? '酷猫办公 - 服务条款' : '酷猫办公 - 隐私政策'}</h3>
              <span style={{ fontSize: '24px', color: '#999', cursor: 'pointer', lineHeight: '1' }} onClick={() => setDocModal(null)}>&times;</span>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontSize: '13px', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {docModal === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
            </div>

            <div style={{ padding: '15px 20px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button onClick={() => { setIsAgreed(true); setDocModal(null); }} style={{ padding: '10px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>已阅并同意</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}