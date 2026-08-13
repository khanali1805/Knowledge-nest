import type { Metadata } from "next";
import { InformationPageLayout } from "@/components/site/legal/information-page-layout";
import { InformationSection } from "@/components/site/legal/information-section";
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the Knowledge Nest privacy policy and learn how website information may be handled.",
  alternates: {
    canonical: "/privacy-policy",
  },
};
export default function PrivacyPolicyPage() {
  return (
    <InformationPageLayout
      title="Privacy Policy"
      description="This policy explains the types of information that may be collected and how that information may be used."
    >
      <InformationSection
        title="Information We May Collect"
        paragraphs={[
          "Knowledge Nest may collect technical information such as browser type, device type, approximate location, visited pages, referring pages and interaction data.",
          "Information voluntarily submitted through email or website forms may also be received and stored for the purpose of responding to the enquiry.",
        ]}
      />
      <InformationSection
        title="How Information May Be Used"
        paragraphs={[
          "Collected information may be used to operate the website, understand usage patterns, improve content, maintain security and respond to messages.",
          "Personal information is not intended to be sold as an independent product.",
        ]}
      />
      <InformationSection
        title="Cookies"
        paragraphs={[
          "The website may use cookies or similar technologies to remember preferences, measure traffic and support website functionality.",
          "Visitors may control cookies through their browser settings. Disabling cookies may affect some website features.",
        ]}
      />
      <InformationSection
        title="Advertising and Analytics"
        paragraphs={[
          "Third-party advertising or analytics services may use cookies, device information or similar technologies according to their own privacy policies.",
          "Knowledge Nest does not directly control the data practices of independent third-party services.",
        ]}
      />
      <InformationSection
        title="External Links"
        paragraphs={[
          "Articles may contain links to external websites. Knowledge Nest is not responsible for the privacy practices, security or content of external websites.",
          "Visitors should review the privacy policy of any external service they choose to use.",
        ]}
      />
      <InformationSection
        title="Policy Updates"
        paragraphs={[
          "This privacy policy may be updated when website features, legal requirements or data practices change.",
          "Continued use of the website after an update indicates acceptance of the revised policy.",
        ]}
      />
    </InformationPageLayout>
  );
}
