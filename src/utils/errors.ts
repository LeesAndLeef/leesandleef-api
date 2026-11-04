export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const notFound = (message: string) => new HttpError(404, message)
export const unprocessable = (message: string) => new HttpError(422, message)
export const conflict = (message: string) => new HttpError(409, message)
export const unauthorized = (message: string) => new HttpError(401, message)
