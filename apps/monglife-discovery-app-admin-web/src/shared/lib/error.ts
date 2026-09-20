/**
 * react-query 등이 주는 unknown 오류에서 표시할 문구만 꺼낸다.
 *
 * 없으면 호출부마다 `e instanceof Error ? e.message : undefined` 를 쓰게 된다.
 * ApiError 가 Error 를 상속하고 서버가 준 message 를 그대로 싣고 있으므로,
 * 이 한 줄로 백엔드 문구가 화면까지 온다.
 */
export const errorMessage = (error: unknown): string | undefined =>
  error instanceof Error ? error.message : undefined;
