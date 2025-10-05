import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/hooks/useTranslation";

interface SessionSnapshotsProps {
  snapshots: any[];
}

export const SessionSnapshots: React.FC<SessionSnapshotsProps> = ({
  snapshots,
}) => {
  const { t } = useTranslation();

  if (!snapshots || snapshots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("sessions_noHistory")}
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {snapshots.map((snapshot, index) => (
        <AccordionItem
          value={`snapshot-${snapshot.meta.session_id}-${index}`}
          key={`${snapshot.meta.session_id}-${index}`}
        >
          <AccordionTrigger>
            {new Date(snapshot.meta.saved_at_utc).toLocaleDateString()}
            {" at "}
            {new Date(snapshot.meta.saved_at_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{t("snapshot_summary")}</h4>
                <p className="text-sm text-muted-foreground">
                  {snapshot.summary_data.summary_of_interaction}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">{t("snapshot_symptoms")}</h4>
                <p className="text-sm text-muted-foreground">
                  {snapshot.summary_data.symptom_details}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">{t("snapshot_conclusion")}</h4>
                <p className="text-sm text-muted-foreground">
                  {snapshot.summary_data.AI_based_conclusion}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">{t("snapshot_problems")}</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {snapshot.summary_data.find_main_problems.map((problem: string, index: number) => (
                    <li key={index}>{problem}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">{t("snapshot_concerns")}</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {snapshot.summary_data.problems_concern.map((concern: string, index: number) => (
                    <li key={index}>{concern}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">{t("snapshot_solution")}</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {snapshot.summary_data.solution.map((solution: string, index: number) => (
                    <li key={index}>{solution}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">{t("snapshot_recommendation")}</h4>
                <p className="text-sm text-muted-foreground">
                  {snapshot.summary_data.triage_recommendation}
                </p>
              </div>
              {snapshot.summary_data.suggested_doctors && snapshot.summary_data.suggested_doctors.length > 0 && (
                <div>
                  <h4 className="font-semibold">Suggested Doctors</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {snapshot.summary_data.suggested_doctors.map((doctor: string, index: number) => (
                      <li key={index}>{doctor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
