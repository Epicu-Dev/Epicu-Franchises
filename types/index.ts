import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Export all types
export * from './data';
export * from './agendaEvent';
export * from './agendaType';
export * from './city';
export * from './client';
export * from './collaborator';
export * from './establishment';
export * from './establishmentType';
export * from './googleCalendar';
export * from './invoice';
export * from './prospect';
export * from './publication';
export * from './resource';
export * from './todo';
export * from './todoElement';
export * from './todoType';
export * from './user';
