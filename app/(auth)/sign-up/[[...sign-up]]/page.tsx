import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'

import { AuthLayout } from '@/components/auth-layout'

export const metadata: Metadata = {
    title: "Create account",
}

export default function Page() {
    return (
        <AuthLayout
            title="Create your account"
            description="Start tracking your income and spending in minutes."
        >
            <SignUp path="/sign-up" />
        </AuthLayout>
    )
}
