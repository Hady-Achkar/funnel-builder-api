export function updateElementServerId(
  elements: any[],
  elementId: string,
  serverId: number
): any[] {
  return elements.map((element) => {
    if (element.id === elementId) {
      return { ...element, serverId };
    }
    if (element.children && Array.isArray(element.children)) {
      return {
        ...element,
        children: updateElementServerId(element.children, elementId, serverId),
      };
    }
    return element;
  });
}
