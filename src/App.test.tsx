import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { messages } from '@/config/messages'

describe('App', () => {
  it('renders the login screen when there is no session', async () => {
    render(<App />)

    expect(await screen.findByText(messages.auth.loginTitle)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: messages.auth.submit }),
    ).toBeInTheDocument()
  })
})
