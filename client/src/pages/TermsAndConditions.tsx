import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#1e3a8a_0%,_#020617_60%)] text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button
              variant="ghost"
              size="lg"
              className="border border-white/10 bg-white/10 text-white/80 hover:text-white"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to home
            </Button>
          </Link>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-white">
              Terms and Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-200">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4">
              <p className="text-sm text-emerald-200">
                <i className="fas fa-info-circle mr-2"></i>
                <strong>Placeholder Page:</strong> This page will be updated with the official Data#3 Terms and Conditions.
              </p>
            </div>

            <div className="space-y-4">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Overview</h2>
                <p className="leading-relaxed">
                  Welcome to the Data#3 Solution Sprint challenge. By participating in this competition,
                  you agree to abide by these terms and conditions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Competition Rules</h2>
                <ul className="list-disc list-inside space-y-2 leading-relaxed">
                  <li>The leaderboard only displays your first name and last initial</li>
                  <li>An AI judge scores every submission</li>
                  <li>Data#3 may reuse standout entries for demonstrations</li>
                  <li>Data#3 employees and their families are not eligible for prizes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Privacy & Data Collection</h2>
                <p className="leading-relaxed">
                  By submitting your information, you consent to Data#3 collecting and processing your
                  badge details and email address for the purposes of:
                </p>
                <ul className="list-disc list-inside space-y-2 leading-relaxed mt-2">
                  <li>Verifying raffle eligibility</li>
                  <li>Contacting you if you win a prize</li>
                  <li>Displaying your performance on the leaderboard</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Raffle & Prizes</h2>
                <p className="leading-relaxed">
                  Your email address is required for raffle eligibility. By providing your email and
                  submitting your entry, you consent to being contacted if you win the daily Meta AI
                  Glasses raffle or other competition prizes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Changes to Terms</h2>
                <p className="leading-relaxed">
                  Data#3 reserves the right to update these terms at any time. Continued participation
                  after changes constitutes acceptance of the updated terms.
                </p>
              </section>
            </div>

            <div className="border-t border-white/10 pt-6 text-sm text-slate-300">
              <p>
                For questions or concerns about these terms, please contact a Sprint Captain at the
                Data#3 booth.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
