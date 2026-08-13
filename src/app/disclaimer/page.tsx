import type { Metadata } from "next";
import { InformationPageLayout } from "@/components/site/legal/information-page-layout";
import { InformationSection } from "@/components/site/legal/information-section";
export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Read the Knowledge Nest disclaimer regarding educational content and professional advice.",
  alternates: {
    canonical: "/disclaimer",
  },
};
export default function DisclaimerPage() {
  return (
    <InformationPageLayout
      title="Disclaimer"
      description="This disclaimer explains the limitations that apply to information published on Knowledge Nest."
    >
      <InformationSection
        title="General Information"
        paragraphs={[
          "All information published on Knowledge Nest is provided in good faith for general educational and informational purposes.",
          "The website does not guarantee that every statement is complete, current, error-free or suitable for every individual situation.",
        ]}
      />
      <InformationSection
        title="Professional Advice"
        paragraphs={[
          "Finance, health, legal, business and other specialist topics may involve individual risks and circumstances.",
          "Website content should not replace advice from a qualified professional who can assess your specific situation.",
        ]}
      />
      <InformationSection
        title="User Responsibility"
        paragraphs={[
          "Readers are responsible for verifying information before relying on it or using it to make important decisions.",
          "Any action taken based on website content is performed at the reader's own judgment and risk.",
        ]}
      />
      <InformationSection
        title="External Links"
        paragraphs={[
          "Links to external websites may be included for reference. Knowledge Nest does not guarantee the accuracy, availability, safety or policies of external websites.",
          "Visiting or using an external website is subject to the terms and policies of that website.",
        ]}
      />
      <InformationSection
        title="Limitation of Liability"
        paragraphs={[
          "To the extent permitted by applicable law, Knowledge Nest is not responsible for direct or indirect loss resulting from use of the website, reliance on its content or inability to access its services.",
          "Nothing in this disclaimer excludes liability that cannot legally be excluded.",
        ]}
      />
    </InformationPageLayout>
  );
}
