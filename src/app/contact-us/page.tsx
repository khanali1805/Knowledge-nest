import type { Metadata } from "next";
import { InformationPageLayout } from "@/components/site/legal/information-page-layout";
import { InformationSection } from "@/components/site/legal/information-section";
export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Knowledge Nest regarding website content, corrections or general questions.",
  alternates: {
    canonical: "/contact-us",
  },
};
export default function ContactUsPage() {
  return (
    <InformationPageLayout
      title="Contact Us"
      description="Use the contact information below for content questions, correction requests and general website enquiries."
    >
      <InformationSection
        title="General Enquiries"
        paragraphs={[
          "You may contact Knowledge Nest regarding website content, technical issues, correction requests or other general questions.",
          "Please include a clear subject and enough information for the enquiry to be reviewed properly.",
        ]}
      />
      <section>
        <h2 className="text-2xl font-bold tracking-tight">Email</h2>
        <p className="text-muted-foreground mt-4">
          Email:{" "}
          <a
            href="mailto:admin@example.com"
            className="text-foreground font-medium underline underline-offset-4"
          >
            admin@example.com
          </a>
        </p>
      </section>
      <InformationSection
        title="Correction Requests"
        paragraphs={[
          "When reporting an error, include the article title, page address and a clear description of the information that may require correction.",
          "Submitting a request does not guarantee that content will be changed, but every relevant report may be reviewed.",
        ]}
      />
      <InformationSection
        title="Response Time"
        paragraphs={[
          "Response times may vary depending on the type and complexity of the enquiry.",
          "Messages containing spam, abusive content or unrelated promotional material may not receive a response.",
        ]}
      />
    </InformationPageLayout>
  );
}
