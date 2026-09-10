/** 环境变量统一加载与校验 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`缺少必需的环境变量 ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : fallback;
}
