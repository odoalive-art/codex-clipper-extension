export const LUCIDE_ICONS = {
  zap:
    '<svg class="icon lucide lucide-sparkle-icon lucide-sparkle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path></svg>',
  refreshCw:
    '<svg class="icon lucide lucide-rotate-cw-icon lucide-rotate-cw" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>',
  check:
    '<svg class="icon lucide lucide-check-check-icon lucide-check-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 7 17l-5-5"></path><path d="m22 10-7.5 7.5L13 16"></path></svg>',
  copy:
    '<svg class="icon lucide lucide-copy-icon lucide-copy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>',
  circleX:
    '<svg class="icon lucide lucide-squircle-dashed-icon lucide-squircle-dashed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.77 3.043a34 34 0 0 0-3.54 0"></path><path d="M13.771 20.956a33 33 0 0 1-3.541.001"></path><path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44"></path><path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438"></path><path d="M20.957 10.23a33 33 0 0 1 0 3.54"></path><path d="M3.043 10.23a34 34 0 0 0 .001 3.541"></path><path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438"></path><path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44"></path></svg>',
  download:
    '<svg class="icon lucide lucide-folder-down-icon lucide-folder-down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path><path d="M12 10v6"></path><path d="m15 13-3 3-3-3"></path></svg>',
  send:
    '<svg class="icon lucide lucide-send-icon lucide-send" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>',
  flaskConical:
    '<svg class="icon lucide lucide-message-square-code-icon lucide-message-square-code" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path><path d="m10 8-3 3 3 3"></path><path d="m14 14 3-3-3-3"></path></svg>',
};

export function renderIcon(name) {
  return LUCIDE_ICONS[name] || '';
}
