import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlayOld() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="max-w-2xl w-full shadow-lg border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl">Legacy Sprint Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            This legacy version of the sprint experience has been retired. We now focus entirely on a
            metrics-driven coaching flow that helps teams articulate frustrations, impact, and KPIs without
            suggesting specific technologies.
          </p>
          <p>
            Head over to the current sprint to capture your challenge, size the opportunity, and submit for
            instant scoring with the latest evaluation criteria.
          </p>
          <Button asChild className="mt-4">
            <Link href="/play">Go to the current sprint</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

