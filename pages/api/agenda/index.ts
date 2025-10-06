import type { NextApiRequest, NextApiResponse } from 'next';

import { base } from '../constants';
import { requireValidAccessToken } from '../../../utils/verifyAccessToken';

const TABLE_NAME = 'AGENDA';
const VIEW_NAME = 'Grid view';

function parseDateParam(v?: string | string[] | undefined) {
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : v;

  if (!s) return null;
  const d = new Date(s);

  return isNaN(d.getTime()) ? null : d;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const limitRaw = parseInt((req.query.limit as string) || '50', 10);
      const offsetRaw = parseInt((req.query.offset as string) || '0', 10);
      const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 50 : limitRaw));
      const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

      // Ne plus accepter `collaborator` en paramètre : on récupère l'utilisateur à partir
      // de l'access token et on filtre les événements pour ce collaborateur.
      const callerUserId = await requireValidAccessToken(req, res);
      if (!callerUserId) return; // requireValidAccessToken a déjà répondu (403/500)

      // callerUserId est l'id du record dans la table COLLABORATEURS (référence depuis AUTH_ACCESS_TOKEN)
      const collaboratorId = callerUserId;
      // dateStart: if not provided, default to first day of current month at 00:00
      const rawDateStart = req.query.dateStart as string | undefined;
      let dateStart = parseDateParam(rawDateStart);

      if (!dateStart) {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        firstOfMonth.setHours(0, 0, 0, 0);
        dateStart = firstOfMonth;
      }
      const dateEnd = parseDateParam(req.query.dateEnd as string | undefined);

      // Champs attendus (français) : utiliser les champs fournis
      const fields = [
        'Tâche',
        'Date',
        'Date fin rdv', // Nouveau champ pour la date de fin du rendez-vous
        'Type',
        'Description',
        'Collaborateur',
        'Établissements',
        'Google Event ID', // Nouveau champ pour stocker l'ID Google Calendar
        'Creneau', // Champ de liaison vers le créneau de publication
      ];

      // Construire la formule de filtrage si besoin
      // const filters: string[] = [];

      // ...existing code...

      // Récupérer au plus offset+limit records
      const selectOptions: any = {
        view: VIEW_NAME,
        fields,
        pageSize: Math.min(100, offset + limit),
        maxRecords: offset + limit,
      };

      // Ne pas appliquer de filterByFormula côté serveur — récupérer un set d'enregistrements
      // et filtrer ensuite côté serveur par `collaboratorId`.

      const upToPageRecords = await base(TABLE_NAME).select(selectOptions).all();

      // Mapper records
      const mapped = upToPageRecords.map((r: any) => {
        // champs français
        const task = r.get('Tâche') || '';
        const date = r.get('Date') || '';
        const dateFinRdv = r.get('Date fin rdv') || '';
        const type = r.get('Type') || '';
        const description = r.get('Description') || '';
        const collaborators = r.get('Collaborateur') || [];
        const etablissements = r.get('Établissements') || [];
        const googleEventId = r.get('Google Event ID') || '';
        const creneauLien = r.get('Creneau') || [];
        const creneauId = Array.isArray(creneauLien) && creneauLien.length > 0 ? creneauLien[0] : '';

        return {
          id: r.id,
          task,
          date,
          dateFinRdv,
          type,
          description,
          collaborators,
          etablissements,
          googleEventId,
          creneauId,
        };
      });

      // Récupérer les catégories d'établissement pour tous les événements
      const establishmentIds = Array.from(new Set(mapped.flatMap((ev: any) => ev.etablissements || [])));
      let establishmentCategories: Record<string, string[]> = {};

      if (establishmentIds.length > 0) {
        try {
          const establishmentRecords = await base('ÉTABLISSEMENTS')
            .select({
              filterByFormula: `OR(${establishmentIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
              fields: ['Catégorie'],
              pageSize: Math.min(establishmentIds.length, 100),
              maxRecords: establishmentIds.length,
            })
            .all();

          // Collecter tous les IDs de catégories
          const categoryIds = new Set<string>();

          establishmentRecords.forEach((est: any) => {
            const categories = est.get('Catégorie') || [];

            categories.forEach((catId: string) => categoryIds.add(catId));
          });

          // Récupérer les noms des catégories
          const categoryNames: Record<string, string> = {};

          if (categoryIds.size > 0) {
            const categoryRecords = await base('CATÉGORIES')
              .select({
                filterByFormula: `OR(${Array.from(categoryIds).map(id => `RECORD_ID() = '${id}'`).join(',')})`,
                fields: ['Name'],
                maxRecords: categoryIds.size,
              })
              .all();

            categoryRecords.forEach((cat: any) => {
              categoryNames[cat.id] = cat.get('Name') || '';
            });
          }

          // Mapper les catégories d'établissement avec leurs noms
          establishmentRecords.forEach((est: any) => {
            const categoryIds = est.get('Catégorie') || [];
            const categoryNamesForEst = categoryIds.map((catId: string) => categoryNames[catId]).filter(Boolean);

            establishmentCategories[est.id] = categoryNamesForEst;
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Erreur lors de la récupération des catégories d\'établissement:', error);
          // Ignorer les erreurs de récupération des catégories d'établissement
        }
      }

      // filtrage par date côté serveur (après mapping) + fallback filtrage par collaboratorId
      let filtered = mapped.filter((ev: any) => {
        if (dateStart) {
          const evDate = new Date(ev.date);

          evDate.setHours(0, 0, 0, 0);
          if (evDate < dateStart) return false;
        }
        if (dateEnd) {
          const evDate = new Date(ev.date);

          evDate.setHours(23, 59, 59, 999);
          if (evDate > dateEnd) return false;
        }
        // filtrage par collaborateur (fallback côté serveur si filterByFormula n'a pas fonctionné)
        const coll = ev.collaborators || ev.Collaborateur || [];
        if (collaboratorId) {
          if (Array.isArray(coll) && coll.length > 0) {
            if (!coll.includes(collaboratorId)) return false;
          } else if (typeof coll === 'string' && coll.length > 0) {
            if (coll !== collaboratorId) return false;
          } else {
            return false;
          }
        }

        return true;
      });

      const page = filtered.slice(offset, offset + limit);

      // Enrichir les événements avec les catégories d'établissement
      const enrichedEvents = page.map((event: any) => {
        const eventEstablishmentIds = event.etablissements || [];
        const eventCategories = eventEstablishmentIds.flatMap((id: string) => establishmentCategories[id] || []);

        return {
          ...event,
          establishmentCategories: eventCategories,
        };
      });

      // Si debug=1, inclure des informations de diagnostic
      const debugMode = String(req.query.debug || '') === '1';

      if (debugMode) {
        return res.status(200).json({
          events: enrichedEvents,
          total: filtered.length,
          debug: {
            callerUserId: collaboratorId,
            fetchedCount: upToPageRecords.length,
            mappedCount: mapped.length,
            filteredCount: filtered.length,
            sampleCollaborators: mapped.slice(0, 5).map((m: any) => m.collaborators),
          },
        });
      }

      res.status(200).json({ events: enrichedEvents, total: filtered.length });

      return;
    }

    if (req.method === 'POST') {
      const body = req.body;

      // Basic validation for required French fields
      if (!body || (!body['Tâche'] && !body.tache && !body.title && !body.name)) {
        return res.status(400).json({ error: 'Tâche requise' });
      }
      if (!body['Date'] && !body.date) {
        return res.status(400).json({ error: 'Date requise' });
      }

      const fieldsToCreate: any = {
        'Tâche': body['Tâche'] || body.tache || body.title || body.name || '',
        'Date': body['Date'] || body.date,
        'Date fin rdv': body['Date fin rdv'] || body.dateFinRdv || body.endDate || '',
        'Type': body['Type'] || body.type || '',
        'Description': body['Description'] || body.description || body.desc || '',
        'Google Event ID': body['Google Event ID'] || body.googleEventId || '',
        'Creneau': body['Creneau'] || body.creneauId || body.creneau || '',
      };
     

      // Collaborateur linkage: expect an array of record ids or single id
      const collPayload = body['Collaborateur'] || body.collaborator || body.collaborateurs || body.collaborators || body.user;

      if (collPayload) {
        if (Array.isArray(collPayload)) fieldsToCreate['Collaborateur'] = collPayload;
        else fieldsToCreate['Collaborateur'] = [collPayload];
      }

      // Établissements linkage: expect an array of record ids or single id
      const etablissementPayload = body['Établissements'] || body.etablissement || body.etablissements || body.establishment || body.establishments;

      if (etablissementPayload) {
        if (Array.isArray(etablissementPayload)) fieldsToCreate['Établissements'] = etablissementPayload;
        else fieldsToCreate['Établissements'] = [etablissementPayload];
      }

      const created = await base(TABLE_NAME).create([{ fields: fieldsToCreate }]);

      res.status(201).json({ id: created[0].id, ...fieldsToCreate });

      return;
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const id = (req.query.id as string) || body.id;

      if (!id) return res.status(400).json({ error: 'id requis' });

      const fieldsToUpdate: any = {};

      if (body['Tâche'] ?? body.tache ?? body.title ?? body.name) {
        fieldsToUpdate['Tâche'] = body['Tâche'] || body.tache || body.title || body.name;
      }
      if (body['Date'] ?? body.date) {
        fieldsToUpdate['Date'] = body['Date'] || body.date;
      }
      if (body['Date fin rdv'] ?? body.dateFinRdv ?? body.endDate) {
        fieldsToUpdate['Date fin rdv'] = body['Date fin rdv'] || body.dateFinRdv || body.endDate;
      }
      if (body['Type'] ?? body.type) {
        fieldsToUpdate['Type'] = body['Type'] || body.type;
      }
      if (body['Description'] ?? body.description ?? body.desc) {
        fieldsToUpdate['Description'] = body['Description'] || body.description || body.desc;
      }
      if (body['Google Event ID'] ?? body.googleEventId) {
        fieldsToUpdate['Google Event ID'] = body['Google Event ID'] || body.googleEventId;
      }
      if (body['Creneau'] ?? body.creneauId ?? body.creneau) {
        fieldsToUpdate['Creneau'] = body['Creneau'] || body.creneauId || body.creneau;
      }

      // Collaborateur linkage: accept array, single id, null (to clear)
      if (Object.prototype.hasOwnProperty.call(body, 'Collaborateur') || Object.prototype.hasOwnProperty.call(body, 'collaborator') || Object.prototype.hasOwnProperty.call(body, 'collaborateurs') || Object.prototype.hasOwnProperty.call(body, 'collaborators') || Object.prototype.hasOwnProperty.call(body, 'user')) {
        const collPayload = body['Collaborateur'] ?? body.collaborator ?? body.collaborateurs ?? body.collaborators ?? body.user;

        if (collPayload === null) {
          // clear links
          fieldsToUpdate['Collaborateur'] = [];
        } else if (Array.isArray(collPayload)) {
          fieldsToUpdate['Collaborateur'] = collPayload;
        } else if (collPayload) {
          fieldsToUpdate['Collaborateur'] = [collPayload];
        } else {
          // empty string or falsy -> clear
          fieldsToUpdate['Collaborateur'] = [];
        }
      }

      // Établissements linkage: accept array, single id, null (to clear)
      if (Object.prototype.hasOwnProperty.call(body, 'Établissements') || Object.prototype.hasOwnProperty.call(body, 'etablissement') || Object.prototype.hasOwnProperty.call(body, 'etablissements') || Object.prototype.hasOwnProperty.call(body, 'establishment') || Object.prototype.hasOwnProperty.call(body, 'establishments')) {
        const etablissementPayload = body['Établissements'] ?? body.etablissement ?? body.etablissements ?? body.establishment ?? body.establishments;

        if (etablissementPayload === null) {
          // clear links
          fieldsToUpdate['Établissements'] = [];
        } else if (Array.isArray(etablissementPayload)) {
          fieldsToUpdate['Établissements'] = etablissementPayload;
        } else if (etablissementPayload) {
          fieldsToUpdate['Établissements'] = [etablissementPayload];
        } else {
          // empty string or falsy -> clear
          fieldsToUpdate['Établissements'] = [];
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      }

      const updated = await base(TABLE_NAME).update([{ id, fields: fieldsToUpdate }]);

      res.status(200).json({ id: updated[0].id, fields: updated[0].fields });

      return;
    }

    if (req.method === 'DELETE') {
      const id = (req.query.id as string) || req.body.id;

      if (!id) return res.status(400).json({ error: 'id requis' });

      // Récupérer les détails de l'événement avant suppression pour vérifier s'il s'agit d'une publication
      let eventToDelete: any = null;
      try {
        eventToDelete = await base(TABLE_NAME).find(id);
      } catch (error) {
        return res.status(404).json({ error: 'Événement introuvable' });
      }

      // Vérifier si c'est un événement de type publication
      const eventType = eventToDelete.get('Type') || '';
      const eventDate = eventToDelete.get('Date') || '';
      const eventEtablissements = eventToDelete.get('Établissements') || [];
      const creneauLien = eventToDelete.get('Creneau') || [];
      const creneauId = Array.isArray(creneauLien) && creneauLien.length > 0 ? creneauLien[0] : '';

      // Si c'est une publication, libérer le créneau associé
      if (eventType === 'publication') {
        
        try {
          let creneauToUpdate = null;
          
          // Méthode 1: Utiliser l'ID du créneau stocké (plus fiable)
          if (creneauId) {
            try {
              creneauToUpdate = await base('CALENDRIER PUBLICATIONS').find(creneauId);
            } catch (error) {
              creneauToUpdate = null;
            }
          }
          
          // Méthode 2: Recherche par catégorie et date (fallback)
          if (!creneauToUpdate && eventDate && Array.isArray(eventEtablissements) && eventEtablissements.length > 0) {
            
            const establishmentId = Array.isArray(eventEtablissements) ? eventEtablissements[0] : eventEtablissements;
            
            const establishment = await base('ÉTABLISSEMENTS').find(establishmentId);
            const establishmentCategories = establishment.get('Catégorie') || [];

            if (Array.isArray(establishmentCategories) && establishmentCategories.length > 0) {
              // Récupérer le nom de la catégorie
              const categoryId = establishmentCategories[0];
              
              const category = await base('CATÉGORIES').find(categoryId);
              const categoryName = String(category.get('Name') || '');

              // Mapper le nom de catégorie vers l'emoji correspondant
              const categoryMapping: Record<string, string> = {
                'FOOD': '🟠 FOOD',
                'SHOP': '🟣 SHOP', 
                'TRAVEL': '🟢 TRAVEL',
                'FUN': '🔴 FUN',
                'BEAUTY': '🩷 BEAUTY'
              };
              
              const categoryWithEmoji = categoryMapping[categoryName.toUpperCase()] || categoryName;

              // Rechercher le créneau correspondant
              const filterFormula = `AND({Catégorie} = "${categoryWithEmoji.replace(/"/g, '\\"')}", {DATE} = "${eventDate}")`;
              
              const creneauxResponse = await base('CALENDRIER PUBLICATIONS').select({
                filterByFormula: filterFormula,
                fields: ['Statut de publication'],
                maxRecords: 1
              }).firstPage();

              
              if (creneauxResponse && creneauxResponse.length > 0) {
                creneauToUpdate = creneauxResponse[0];
              } 
            }
          }
          
          // Libérer le créneau si trouvé
          if (creneauToUpdate) {
            const currentStatus = creneauToUpdate.get('Statut de publication') || [];
            
            // Vérifier si le créneau n'est pas déjà libre
            const freeStatusId = 'recfExTXxcNivX1i4';
            
            // Si le statut n'est pas déjà "Libre", le libérer
            if (Array.isArray(currentStatus) && !currentStatus.includes(freeStatusId)) {
              
              // Libérer le créneau en le passant à Libre
              await base('CALENDRIER PUBLICATIONS').update([{
                id: creneauToUpdate.id,
                fields: {
                  'Statut de publication': [freeStatusId] // Libre
                }
              }]);
              
            }
          } 
        } catch (error) {
          // Log l'erreur mais continue la suppression de l'événement
          console.error('Erreur lors de la libération du créneau:', error);
        }
      }

      // Vérifier s'il y a un ID Google Calendar associé et le supprimer
      const googleEventId = eventToDelete.get('Google Event ID');
      if (googleEventId) {
        try {
          // Appeler l'API de suppression Google Calendar
          const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google-calendar/events/delete?eventId=${googleEventId}`, {
            method: 'DELETE',
            headers: {
              'Cookie': req.headers.cookie || '', // Transmettre les cookies d'authentification
            },
          });
          
          if (deleteResponse.ok) {
          } else {
            console.warn(`⚠️ Impossible de supprimer l'événement Google Calendar ${googleEventId}:`, await deleteResponse.text());
          }
        } catch (error) {
          // Log l'erreur mais continue la suppression de l'événement Airtable
          console.error('Erreur lors de la suppression de l\'événement Google Calendar:', error);
        }
      }

      const deleted = await base(TABLE_NAME).destroy([id]);

      res.status(200).json({ id: deleted[0].id });

      return;
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
}
