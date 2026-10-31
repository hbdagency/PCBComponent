# PCB Component Services

> ECAD library & component engineering for PCB design teams.

Schematic symbols, IPC-7351B footprints, 3D models and clean component data for PCB design teams across Altium, Allegro, PADS, Xpedition, and KiCad.

## Structure

```
├── assets/
│   ├── css/
│   │   └── style.css       # Design system and typography styles
│   ├── img/
│   │   └── ...             # Brand and service vector artwork
│   └── js/
│       └── main.js         # Mobile navigation, accordions & interactions
├── 404.html                # Custom 404 page
├── contact.html            # Quote request and contact page
├── index.html              # Homepage
├── services.html           # Full service breakdown
├── team.html               # Engineering team and workflow
├── vercel.json             # Vercel routing & caching configuration
└── .vercelignore           # Deployment ignore rules
```

## Deployment

Configured for seamless deployment on [Vercel](https://vercel.com):
- Clean URLs enabled (`/services` -> `/services.html`)
- Immutable caching headers for static assets in `assets/`
- Custom branded 404 error handling
