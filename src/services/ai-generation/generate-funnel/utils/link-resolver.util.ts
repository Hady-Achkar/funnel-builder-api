export function replacePageNamesInLinks(
  elements: any[],
  pageNameToLinkingId: Map<string, string>
): any[] {
  return elements.map((element) => {
    // Clone element to avoid mutation
    const updatedElement = { ...element };

    // Check if element has a link property
    if (
      updatedElement.link &&
      updatedElement.link.enabled &&
      updatedElement.link.href
    ) {
      const href = updatedElement.link.href;

      // Check if href matches any page name
      pageNameToLinkingId.forEach((linkingId, pageName) => {
        // Match exact page name or page name with leading slash
        if (href === pageName || href === `/${pageName}`) {
          updatedElement.link = {
            ...updatedElement.link,
            href: linkingId,
            type: "internal",
          };
        }
      });
    }

    // Recursively process children (for form, faq, quiz, etc.)
    if (updatedElement.children && Array.isArray(updatedElement.children)) {
      updatedElement.children = replacePageNamesInLinks(
        updatedElement.children,
        pageNameToLinkingId
      );
    }

    return updatedElement;
  });
}
