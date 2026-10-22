import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'

import { AuthLayout } from '@/components/auth-layout'

export const metadata: Metadata = {
    title: "Sign in",
}

export default function Page() {
    return (
        <AuthLayout
            title="Welcome back"
            description="Sign in to get back to your dashboard."
        >
            <SignIn path="/sign-in" />
        </AuthLayout>
    )
}
