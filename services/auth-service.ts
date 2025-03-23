import { supabase } from "@/lib/supabase";

// 响应接口
interface AuthResult {
  success: boolean;
  message: string;
  data?: any;
}

// 注册新用户
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: '验证邮件已发送，请查收邮箱完成注册',
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : '注册过程中发生错误',
    };
  }
}

// 用户登录
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: '登录成功',
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : '登录过程中发生错误',
    };
  }
}

// 验证邮箱
export async function verifyEmail(email: string, token: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: '邮箱验证成功',
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : '验证过程中发生错误',
    };
  }
}
