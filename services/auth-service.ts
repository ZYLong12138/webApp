import { supabase } from "@/lib/supabase";
import type { AuthResult } from "@/types/auth";
import { useRouter } from "next/navigation";

// 注册新用户
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    // 先检查邮箱是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      console.error("Error checking existing user:", checkError)
      return {
        success: false,
        message: '检查邮箱时发生错误'
      }
    }

    if (existingUser) {
      return {
        success: false,
        message: '该邮箱已被注册'
      }
    }

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

// 退出登录，此函数用户退出登录后，删除本地存储认证信息，并重定向到app首页。
export async function signOut(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error)
      return false
    }
    
    // 重定向到首页
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    return true
  } catch (error) {
    console.error("Error in signOut:", error)
    return false
  }
}