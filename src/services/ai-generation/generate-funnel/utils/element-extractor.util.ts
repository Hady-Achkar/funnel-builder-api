export function extractQuizElements(elements: any[]): any[] {
  const quizzes: any[] = [];

  function traverse(els: any[]) {
    els.forEach((element) => {
      if (element.type === "quiz") {
        quizzes.push(element);
      }
      if (element.children && Array.isArray(element.children)) {
        traverse(element.children);
      }
    });
  }

  traverse(elements);
  return quizzes;
}

/**
 * Extract form elements from a page
 */
export function extractFormElements(elements: any[]): any[] {
  const forms: any[] = [];

  function traverse(els: any[]) {
    els.forEach((element) => {
      if (element.type === "form") {
        forms.push(element);
      }
      if (element.children && Array.isArray(element.children)) {
        traverse(element.children);
      }
    });
  }

  traverse(elements);
  return forms;
}
