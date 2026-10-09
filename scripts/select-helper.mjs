export async function selectByValue(page, trigger, value) {
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const listbox = page.getByRole("listbox");
  try {
    await listbox.waitFor({ state: "visible", timeout: 1500 });
  } catch {
    // A just-navigated mobile header can miss the first pointer event during
    // its layout transition. Opening with the native select keyboard gesture
    // keeps the interaction test deterministic and also covers keyboard use.
    await trigger.press("ArrowDown");
    await listbox.waitFor({ state: "visible" });
  }
  const options = listbox.getByRole("option");
  for (let index = 0; index < await options.count(); index += 1) {
    const option = options.nth(index);
    if (await option.getAttribute("data-value") === value) {
      await option.click();
      return;
    }
  }
  throw new Error(`No select option found for value: ${value}`);
}
