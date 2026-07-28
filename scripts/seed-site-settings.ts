import {
  defaultSiteSettings,
  getSiteSettings,
  saveSiteSettings,
} from "../src/lib/settings/site-settings-store";
async function main() {
  const currentSettings = await getSiteSettings();
  const savedSettings = await saveSiteSettings({
    ...defaultSiteSettings,
    ...currentSettings,
  });
  console.log(JSON.stringify(savedSettings, null, 2));
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
