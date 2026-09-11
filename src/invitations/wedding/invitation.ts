import type { InvitationDefinition } from "../../core/invitation/index.ts";
import { validateInvitationDefinition } from "../../core/invitation/index.ts";
import type { WeddingMessageKey } from "./locales/es.ts";
import type { WeddingLocale } from "./locales/types.ts";
import { weddingRsvpForm } from "./rsvpForm.ts";
import { weddingRsvpSections } from "./rsvpSections.ts";
import { weddingThemeId } from "./theme.ts";

export const weddingInvitation = {
  id: "gala-y-valentin",
  event: {
    type: "wedding",
    title: "event.title",
    date: "2027-06-12T12:00:00+02:00",
    timezone: "Europe/Madrid",
    hashtag: "event.hashtag",
  },
  controller: {
    name: "controller.name",
    email: "hola@ejemplo.com",
  },
  theme: {
    id: weddingThemeId,
  },
  seo: {
    title: "event.seoTitle",
    description: "event.seoDescription",
  },
  localization: {
    defaultLocale: "es",
    supportedLocales: ["es", "en", "bg"],
    selector: {
      visible: true,
    },
    fallback: {bg: "en", en: "es"},
  },
  sections: [
    {
      id: "hero",
      type: "hero",
      enabled: true,
      content: {
        partnerOne: "hero.partnerOne",
        partnerTwo: "hero.partnerTwo",
        subtitle: "hero.subtitle",
      },
    },
    {
      id: "countdown",
      type: "countdown",
      enabled: true,
      content: {
        label: "countdown.label",
        todayLabel: "countdown.today",
        unitLabels: {
          days: "countdown.days",
          hours: "countdown.hours",
          minutes: "countdown.minutes",
          seconds: "countdown.seconds",
        },
      },
    },
    {
      id: "video",
      type: "video",
      enabled: true,
      content: {
        assetId: "wedding-hero-video",
        posterAssetId: "wedding-hero-video-poster",
        // Enciende esto **cuando el poster se regenere sin texto**. El actual lleva
        // "Wedding Day 26.06.2027" quemado contra el 2027-06-12 de `event.date`, asi que con
        // ambos activos se verian dos fechas distintas a la vez. Ver el comentario del contrato
        // en core/invitation/types.ts y docs/04-development/MEDIA_WORKFLOW.md.
        dateOverlay: false,
        preload: "none",
        aspectRatio: "9 / 16",
        label: "video.label",
        playLabel: "video.play",
        loadingLabel: "video.loading",
        errorLabel: "video.error",
      },
    },
    {
      id: "venue",
      type: "venue",
      enabled: true,
      content: {
        label: "venue.label",
        mapLabel: "venue.map",
        mapPickerLabel: "venue.map.choose",
        mapPickerCloseLabel: "venue.map.close",
        mapProviders: [
          {
            id: "device",
            label: "venue.map.device",
            badge: "venue.map.recommended",
          },
          { id: "google", label: "venue.map.google" },
          { id: "apple", label: "venue.map.apple" },
        ],
        items: [
          {
            id: "ceremony",
            typeLabel: "venue.ceremony.type",
            name: "venue.ceremony.name",
            time: "12:00",
            mapsQuery: "C. del Nuncio, 14, Centro, 28005 Madrid",
          },
          {
            id: "reception",
            typeLabel: "venue.reception.type",
            name: "venue.reception.name",
            time: "14:00",
            mapsQuery: "P.º de Fernán Núñez, 4, Retiro, 28009 Madrid",
          },
        ],
      },
    },
    {
      id: "lodging",
      type: "lodging",
      enabled: true,
      content: {
        label: "lodging.label",
        noteKey: "lodging.note",
        bookingLabel: "lodging.book",
        newTabLabel: "lodging.newTab",
        priceTierLabels: {
          1: "lodging.priceTier.affordable",
          2: "lodging.priceTier.mid",
          3: "lodging.priceTier.premium",
        },
        items: [
          {
            id: "hotel-centro",
            name: "lodging.hotelCentro.name",
            address: "lodging.hotelCentro.address",
            bookingUrl: "https://www.booking.com/hotel/es/example-centro.html",
            priceTier: 2,
            highlightKey: "lodging.hotelCentro.highlight",
          },
          {
            id: "hostal-retiro",
            name: "lodging.hostalRetiro.name",
            address: "lodging.hostalRetiro.address",
            bookingUrl: "https://www.booking.com/hotel/es/example-retiro.html",
            priceTier: 1,
            noteKey: "lodging.hostalRetiro.note",
          },
        ],
      },
    },
    {
      id: "gifts",
      type: "gifts",
      enabled: true,
      content: {
        label: "gifts.label",
        noteKey: "gifts.note",
        fraudWarningKey: "gifts.warning",
        newTabLabel: "gifts.newTab",
        account: {
          iban: "ES00 0000 0000 0000 0000 0000",
          holderKey: "gifts.account.holder",
          bizum: {
            enabled: true,
            labelKey: "gifts.account.bizum",
            // Los nombres salen de las claves del hero: son la misma persona, y asi un cambio de
            // nombre no hay que perseguirlo por dos sitios ni traducirlo dos veces.
            numbers: [
              { labelKey: "hero.partnerOne", value: "+34 600 000 000" },
              { labelKey: "hero.partnerTwo", value: "+34 611 000 000" },
            ],
          },
          revealOnRequest: true,
          revealLabel: "gifts.account.reveal",
          ibanLabel: "gifts.account.iban",
          copyLabel: "gifts.account.copy",
          copiedLabel: "gifts.account.copied",
        },
      },
    },
    {
      id: "rsvp-cta",
      type: "rsvp-cta",
      enabled: true,
      content: {
        label: "rsvp.cta",
        closedLabel: "rsvp.closed.cta",
        deadlineNotice: "rsvp.deadline.notice",
        closing: true,
      },
    },
  ],
  capabilities: {
    rsvp: {
      enabled: true,
      deadline: "2027-05-12T23:59:59+02:00",
      form: weddingRsvpForm,
    },
    admin: {
      enabled: true,
      auth: { method: "password" },
      source: "rsvp",
      // Las columnas siguen a las secciones que el formulario pregunta: una seccion apagada no
      // deja una columna de guiones en la tabla, ni en el CSV que se entrega al catering.
      columns: [
        "fullName",
        "attending",
        // Sin `dietaryOther` la alergia escrita a mano no aparecia en la tabla, ni en el modal de
        // edicion, ni en el CSV que el propio aviso del panel manda dar al catering: un invitado
        // con "Alergia leve a los frutos secos" se exportaba como "Ninguna, como de todo".
        ...(weddingRsvpSections.dietary ? ["dietaryOptions", "dietaryOther"] : []),
        ...(weddingRsvpSections.bus ? ["busOption"] : []),
        ...(weddingRsvpSections.song ? ["songRequest"] : []),
        "message",
      ],
      // Sustantivos para la pareja, no las preguntas que se le hicieron al invitado. El copy ya
      // estaba escrito en los tres catalogos y no lo usaba nadie.
      columnLabels: {
        fullName: "admin.guest",
        attending: "admin.attends",
        dietaryOptions: "admin.dietary",
        dietaryOther: "admin.dietaryOther",
        busOption: "admin.bus",
        songRequest: "admin.song",
        message: "admin.message",
      },
      // Igual que las columnas: sin autobus no hay tarjeta de transporte que contar, y la que
      // habia contaba a todo el mundo como "transporte propio" porque nadie podia responder otra
      // cosa.
      metrics: {
        attendanceFieldId: "attending",
        ...(weddingRsvpSections.bus
          ? { transportFieldId: "busOption", ownTransportValue: "no" }
          : {}),
        ...(weddingRsvpSections.dietary
          ? { dietaryFieldIds: ["dietaryOptions", "dietaryOther"] }
          : {}),
      },
      mutations: { rsvpClosure: { enabled: true } },
      controls: {
        csvExport: { enabled: true },
        search: { enabled: true },
        sorting: { enabled: true, default: "newest" },
        pagination: {
          enabled: true,
          pageSize: 10,
          pageSizeSelector: { enabled: true, options: [10, 25, 50, 100] },
        },
        resultCount: { enabled: true },
        freshness: { enabled: true },
      },
    },
  },
} as const satisfies InvitationDefinition<WeddingLocale, WeddingMessageKey>;

const definitionErrors = validateInvitationDefinition(weddingInvitation);
if (definitionErrors.length > 0) {
  throw new Error(`Invalid wedding invitation: ${definitionErrors.join("; ")}`);
}
