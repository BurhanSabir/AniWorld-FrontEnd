// This file contains API calls for authentication
// In a real app, these would call your Rails backend

interface LoginResponse {
  token: string
  user: {
    id: number
    name: string
    email: string
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  // In a real app, this would be a fetch call to your Rails API
  // return fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // }).then(res => res.json())

  // For demo purposes, we'll simulate a successful login
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: "fake-jwt-token",
        user: {
          id: 1,
          name: "Demo User",
          email: email,
        },
      })
    }, 500)
  })
}

export async function signup(name: string, email: string, password: string): Promise<LoginResponse> {
  // In a real app, this would be a fetch call to your Rails API
  // return fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name, email, password }),
  // }).then(res => res.json())

  // For demo purposes, we'll simulate a successful signup
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: "fake-jwt-token",
        user: {
          id: 1,
          name: name,
          email: email,
        },
      })
    }, 500)
  })
}
