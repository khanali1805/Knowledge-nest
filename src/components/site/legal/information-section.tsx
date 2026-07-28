type InformationSectionProps = {
  title: string;
  paragraphs: string[];
};
export function InformationSection({ title, paragraphs }: InformationSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
