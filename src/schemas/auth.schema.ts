import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.').trim(),
  password: z.string().min(1, '비밀번호를 입력해주세요.').trim()
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, '이름은 2자 이상이어야 합니다.').trim(),
    email: z.string().min(1, '이메일을 입력해주세요.').email('올바른 이메일 형식이 아닙니다.').trim(),
    password: z.string().min(4, '비밀번호는 4자 이상이어야 합니다.'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword']
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
