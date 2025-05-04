import { DatabaseSetup } from "@/components/database-setup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DatabaseSetupPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <Card className="max-w-3xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>Set up the necessary database tables for AniWorld to function properly.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-muted-foreground">
            AniWorld requires several database tables to store your watchlist, ratings, and profile information. This
            page will help you set up these tables in your Supabase database.
          </p>

          <DatabaseSetup />
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>Common issues and solutions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Error: "function execute_sql() does not exist"</h3>
            <p className="text-sm text-muted-foreground">
              This error occurs when the application tries to use a custom SQL function that doesn't exist in your
              database. You'll need to follow the manual setup instructions to create the necessary tables.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-1">Error: "relation watchlist does not exist"</h3>
            <p className="text-sm text-muted-foreground">
              This error occurs when the application tries to access the watchlist table before it's been created. Use
              the setup button above to create the necessary tables.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-1">Manual Setup</h3>
            <p className="text-sm text-muted-foreground">
              If automatic setup fails, you can manually create the necessary tables by running the SQL code provided in
              the Supabase SQL Editor. See the DATABASE_SETUP.md file for detailed instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
