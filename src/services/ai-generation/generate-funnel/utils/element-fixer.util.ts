export function autoFixMissingFields(elements: any[]): any[] {
  if (!Array.isArray(elements)) {
    return [];
  }

  return elements.map((element) => {
    if (!element || typeof element !== "object") {
      return element;
    }

    const fixedElement = { ...element };

    // ==================== CORE FIELDS (ALL ELEMENTS) ====================

    // Ensure id exists
    if (!fixedElement.id || typeof fixedElement.id !== "string") {
      const type = fixedElement.type || "element";
      fixedElement.id = `${type}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 7)}`;
    }

    // Ensure type exists and is lowercase
    if (!fixedElement.type || typeof fixedElement.type !== "string") {
      fixedElement.type = "text"; // Default to text if missing
    } else {
      fixedElement.type = fixedElement.type.toLowerCase();
    }

    // Ensure props object exists
    if (!fixedElement.props || typeof fixedElement.props !== "object") {
      fixedElement.props = {};
    }

    // Ensure styles object exists
    if (!fixedElement.styles || typeof fixedElement.styles !== "object") {
      fixedElement.styles = {};
    }

    // Ensure link object exists (required for most elements)
    if (!fixedElement.link || typeof fixedElement.link !== "object") {
      fixedElement.link = {
        enabled: false,
        href: "",
        target: "_self",
        type: "internal",
      };
    } else {
      // Fix missing link fields
      if (typeof fixedElement.link.enabled !== "boolean")
        fixedElement.link.enabled = false;
      if (!fixedElement.link.href) fixedElement.link.href = "";
      if (!fixedElement.link.target) fixedElement.link.target = "_self";
      if (!fixedElement.link.type) fixedElement.link.type = "internal";
    }

    // ==================== ELEMENT-SPECIFIC FIXES ====================

    const elementType = fixedElement.type;

    // TEXT ELEMENT
    if (elementType === "text") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label:
            typeof fixedElement.content === "string"
              ? fixedElement.content
              : "Text",
        };
      } else if (!fixedElement.content.label) {
        fixedElement.content.label = "Text";
      }

      // Fix props.format
      if (
        !fixedElement.props.format ||
        typeof fixedElement.props.format !== "object"
      ) {
        fixedElement.props.format = {
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
        };
      } else {
        // Ensure all format fields exist
        if (typeof fixedElement.props.format.bold !== "boolean")
          fixedElement.props.format.bold = false;
        if (typeof fixedElement.props.format.italic !== "boolean")
          fixedElement.props.format.italic = false;
        if (typeof fixedElement.props.format.underline !== "boolean")
          fixedElement.props.format.underline = false;
        if (typeof fixedElement.props.format.strikethrough !== "boolean")
          fixedElement.props.format.strikethrough = false;
      }

      // Add missing props
      if (!fixedElement.props.size) fixedElement.props.size = "md";
      if (!fixedElement.props.align) fixedElement.props.align = "left";
      if (!fixedElement.props.borderRadius)
        fixedElement.props.borderRadius = "NONE";
    }

    // BUTTON ELEMENT
    else if (elementType === "button") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label:
            typeof fixedElement.content === "string"
              ? fixedElement.content
              : "Button",
        };
      } else if (!fixedElement.content.label) {
        fixedElement.content.label = "Button";
      }

      // Fix props.format
      if (
        !fixedElement.props.format ||
        typeof fixedElement.props.format !== "object"
      ) {
        fixedElement.props.format = {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
        };
      } else {
        // Ensure all format fields exist
        if (typeof fixedElement.props.format.bold !== "boolean")
          fixedElement.props.format.bold = true;
        if (typeof fixedElement.props.format.italic !== "boolean")
          fixedElement.props.format.italic = false;
        if (typeof fixedElement.props.format.underline !== "boolean")
          fixedElement.props.format.underline = false;
        if (typeof fixedElement.props.format.strikethrough !== "boolean")
          fixedElement.props.format.strikethrough = false;
      }

      // Add missing props
      if (!fixedElement.props.size) fixedElement.props.size = "md";
      if (!fixedElement.props.align) fixedElement.props.align = "center";
      if (!fixedElement.props.borderRadius)
        fixedElement.props.borderRadius = "SOFT";
    }

    // IMAGE ELEMENT
    else if (elementType === "image") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E",
          alt: "Image",
        };
      } else {
        if (!fixedElement.content.src) {
          fixedElement.content.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E";
        }
        if (!fixedElement.content.alt) {
          fixedElement.content.alt = "Image";
        }
      }

      // Add missing props
      if (!fixedElement.props.shape) fixedElement.props.shape = "auto";
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // VIDEO ELEMENT
    else if (elementType === "video") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23ffffff' font-size='24'%3EVideo%3C/text%3E%3C/svg%3E",
          alt: "Video",
        };
      } else {
        if (!fixedElement.content.src) {
          fixedElement.content.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23ffffff' font-size='24'%3EVideo%3C/text%3E%3C/svg%3E";
        }
        if (!fixedElement.content.alt) {
          fixedElement.content.alt = "Video";
        }
      }

      // Add missing props
      if (!fixedElement.props.shape) fixedElement.props.shape = "auto";
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // MEDIA ELEMENT
    else if (elementType === "media") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E",
          alt: "Media",
        };
      } else {
        if (!fixedElement.content.src) {
          fixedElement.content.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E";
        }
        if (!fixedElement.content.alt) {
          fixedElement.content.alt = "Media";
        }
      }

      // Add missing props
      if (!fixedElement.props.mediaType) fixedElement.props.mediaType = "image";
      if (!fixedElement.props.size) fixedElement.props.size = "md";
      if (!fixedElement.props.borderRadius)
        fixedElement.props.borderRadius = "NONE";
    }

    // MEDIA-WITH-TEXT ELEMENT
    else if (elementType === "media-with-text") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E",
          alt: "Media",
          title: "Title",
          description: "Description",
        };
      } else {
        if (!fixedElement.content.src) {
          fixedElement.content.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e5e7eb'/%3E%3C/svg%3E";
        }
        if (!fixedElement.content.alt) {
          fixedElement.content.alt = "Media";
        }
        if (!fixedElement.content.title) {
          fixedElement.content.title = "Title";
        }
        if (!fixedElement.content.description) {
          fixedElement.content.description = "Description";
        }
      }

      // Add missing props
      if (!fixedElement.props.mediaType) fixedElement.props.mediaType = "image";
      if (!fixedElement.props.position) fixedElement.props.position = "left";
      if (!fixedElement.props.size) fixedElement.props.size = "md";
      if (!fixedElement.props.borderRadius)
        fixedElement.props.borderRadius = "SOFT";
    }

    // ICON ELEMENT
    else if (elementType === "icon") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          value: "StarIcon",
          type: "icon",
        };
      } else {
        if (!fixedElement.content.value) {
          fixedElement.content.value = "StarIcon";
        }
        if (!fixedElement.content.type) {
          fixedElement.content.type = "icon";
        }
      }

      // Add missing props
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // DIVIDER ELEMENT
    else if (elementType === "divider") {
      // Ensure content object exists
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {};
      }

      // Add missing props
      if (!fixedElement.props.borderStyle)
        fixedElement.props.borderStyle = "solid";
    }

    // EMBED ELEMENT
    else if (elementType === "embed") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          src: "",
          type: "iframe",
        };
      } else {
        if (!fixedElement.content.src) {
          fixedElement.content.src = "";
        }
        if (!fixedElement.content.type) {
          fixedElement.content.type = "iframe";
        }
      }

      // Add missing props
      if (!fixedElement.props.height) fixedElement.props.height = "400px";
    }

    // FORM-INPUT ELEMENT
    else if (elementType === "form-input") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          inputType: "email",
          label:
            typeof fixedElement.content === "string"
              ? fixedElement.content
              : "Email",
          placeholder: "Enter your email",
        };
      } else {
        if (!fixedElement.content.inputType) {
          fixedElement.content.inputType = "email";
        }
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Input";
        }
        if (!fixedElement.content.placeholder) {
          fixedElement.content.placeholder = "";
        }
      }

      // Add missing props
      if (typeof fixedElement.props.mandatory !== "boolean")
        fixedElement.props.mandatory = false;
      if (typeof fixedElement.props.withIcon !== "boolean")
        fixedElement.props.withIcon = false;
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // FORM-SELECT ELEMENT
    else if (elementType === "form-select") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label: "Select Option",
          placeholder: "Choose an option",
          options: [],
        };
      } else {
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Select Option";
        }
        if (!fixedElement.content.placeholder) {
          fixedElement.content.placeholder = "Choose an option";
        }
        if (!Array.isArray(fixedElement.content.options)) {
          fixedElement.content.options = [];
        }
      }

      // Add missing props
      if (typeof fixedElement.props.mandatory !== "boolean")
        fixedElement.props.mandatory = false;
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // FORM-CHECKBOX ELEMENT
    else if (elementType === "form-checkbox") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label: "I agree",
        };
      } else {
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Checkbox";
        }
      }

      // Add missing props
      if (typeof fixedElement.props.mandatory !== "boolean")
        fixedElement.props.mandatory = false;
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // FORM-NUMBER ELEMENT
    else if (elementType === "form-number") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label: "Number",
          placeholder: "Enter a number",
          min: 0,
          max: 100,
        };
      } else {
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Number";
        }
        if (!fixedElement.content.placeholder) {
          fixedElement.content.placeholder = "Enter a number";
        }
        if (typeof fixedElement.content.min !== "number")
          fixedElement.content.min = 0;
        if (typeof fixedElement.content.max !== "number")
          fixedElement.content.max = 100;
      }

      // Add missing props
      if (typeof fixedElement.props.mandatory !== "boolean")
        fixedElement.props.mandatory = false;
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // FORM-PHONENUMBER ELEMENT
    else if (elementType === "form-phonenumber") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label: "Phone Number",
          placeholder: "Enter your phone number",
        };
      } else {
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Phone Number";
        }
        if (!fixedElement.content.placeholder) {
          fixedElement.content.placeholder = "Enter your phone number";
        }
      }

      // Add missing props
      if (typeof fixedElement.props.mandatory !== "boolean")
        fixedElement.props.mandatory = false;
      if (!fixedElement.props.size) fixedElement.props.size = "md";

      // Ensure selectedCountry exists
      if (
        !fixedElement.selectedCountry ||
        typeof fixedElement.selectedCountry !== "object"
      ) {
        fixedElement.selectedCountry = {
          code: "US",
          name: "United States",
          icon: "🇺🇸",
          dialCode: "+1",
        };
      }
    }

    // FORM-DATEPICKER ELEMENT
    else if (elementType === "form-datepicker") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label: "Date",
          placeholder: "Select a date",
        };
      } else {
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Date";
        }
        if (!fixedElement.content.placeholder) {
          fixedElement.content.placeholder = "Select a date";
        }
      }

      // Add missing props
      if (typeof fixedElement.props.mandatory !== "boolean")
        fixedElement.props.mandatory = false;
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // FORM-MESSAGE ELEMENT
    else if (elementType === "form-message") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label: "Message",
          placeholder: "Enter your message",
        };
      } else {
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Message";
        }
        if (!fixedElement.content.placeholder) {
          fixedElement.content.placeholder = "Enter your message";
        }
      }

      // Add missing props
      if (typeof fixedElement.props.mandatory !== "boolean")
        fixedElement.props.mandatory = false;
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // FORM ELEMENT (Container)
    else if (elementType === "form") {
      // Ensure children array exists
      if (!Array.isArray(fixedElement.children)) {
        fixedElement.children = [];
      }

      // Ensure serverId exists
      if (fixedElement.serverId === undefined) {
        fixedElement.serverId = null;
      }

      // Ensure integration object exists
      if (
        !fixedElement.integration ||
        typeof fixedElement.integration !== "object"
      ) {
        fixedElement.integration = {
          webhookEnabled: false,
          webhookUrl: "",
        };
      } else {
        if (typeof fixedElement.integration.webhookEnabled !== "boolean")
          fixedElement.integration.webhookEnabled = false;
        if (!fixedElement.integration.webhookUrl)
          fixedElement.integration.webhookUrl = "";
      }

      // Remove link for form elements (not needed)
      delete fixedElement.link;
    }

    // QUIZ ELEMENT
    else if (elementType === "quiz") {
      // Ensure children array exists
      if (!Array.isArray(fixedElement.children)) {
        fixedElement.children = [];
      }

      // Ensure serverId exists
      if (fixedElement.serverId === undefined) {
        fixedElement.serverId = null;
      }

      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          allowMultiple: false,
          showResults: true,
        };
      } else {
        if (typeof fixedElement.content.allowMultiple !== "boolean")
          fixedElement.content.allowMultiple = false;
        if (typeof fixedElement.content.showResults !== "boolean")
          fixedElement.content.showResults = true;
      }

      // Remove link for quiz elements (not needed)
      delete fixedElement.link;
    }

    // ANSWER ELEMENT (Quiz answer option)
    else if (elementType === "answer") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          label: "Answer",
          value: "answer",
        };
      } else {
        if (!fixedElement.content.label) {
          fixedElement.content.label = "Answer";
        }
        if (!fixedElement.content.value) {
          fixedElement.content.value = "answer";
        }
      }

      // Add missing props
      if (typeof fixedElement.props.isCorrect !== "boolean")
        fixedElement.props.isCorrect = false;

      // Remove link for answer elements (not needed)
      delete fixedElement.link;
    }

    // WEBINAR ELEMENT
    else if (elementType === "webinar") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          title: "Webinar",
          description: "Join our webinar",
          startTime: new Date().toISOString(),
          duration: 60,
          registrationUrl: "",
        };
      } else {
        if (!fixedElement.content.title) {
          fixedElement.content.title = "Webinar";
        }
        if (!fixedElement.content.description) {
          fixedElement.content.description = "Join our webinar";
        }
        if (!fixedElement.content.startTime) {
          fixedElement.content.startTime = new Date().toISOString();
        }
        if (typeof fixedElement.content.duration !== "number") {
          fixedElement.content.duration = 60;
        }
        if (!fixedElement.content.registrationUrl) {
          fixedElement.content.registrationUrl = "";
        }
      }

      // Add missing props
      if (!fixedElement.props.size) fixedElement.props.size = "md";
    }

    // FAQ ELEMENT (Container)
    else if (elementType === "faq") {
      // Ensure children array exists (should contain faq-item elements)
      if (!Array.isArray(fixedElement.children)) {
        fixedElement.children = [];
      }

      // Add missing props
      if (!fixedElement.props.expandBehavior)
        fixedElement.props.expandBehavior = "single";

      // Remove link for faq elements (not needed)
      delete fixedElement.link;
    }

    // FAQ-ITEM ELEMENT
    else if (elementType === "faq-item") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          question: "Question",
          answer: "Answer",
        };
      } else {
        if (!fixedElement.content.question) {
          fixedElement.content.question = "Question";
        }
        if (!fixedElement.content.answer) {
          fixedElement.content.answer = "Answer";
        }
      }

      // Add missing props
      if (typeof fixedElement.props.isOpen !== "boolean")
        fixedElement.props.isOpen = false;

      // Remove link for faq-item elements (not needed)
      delete fixedElement.link;
    }

    // COMPARISON-CHART ELEMENT
    else if (elementType === "comparison-chart") {
      // Fix content object
      if (!fixedElement.content || typeof fixedElement.content !== "object") {
        fixedElement.content = {
          title: "Comparison Chart",
          items: [],
        };
      } else {
        if (!fixedElement.content.title) {
          fixedElement.content.title = "Comparison Chart";
        }
        if (!Array.isArray(fixedElement.content.items)) {
          fixedElement.content.items = [];
        }
      }

      // Add missing props
      if (!fixedElement.props.columns) fixedElement.props.columns = 2;
    }

    // ==================== RECURSIVELY FIX CHILDREN ====================

    // Recursively fix children elements
    if (fixedElement.children && Array.isArray(fixedElement.children)) {
      fixedElement.children = autoFixMissingFields(fixedElement.children);
    }

    return fixedElement;
  });
}
