/**
 * OLL detail page load function.
 *
 * Loads the OLL algorithm for the given id param.
 * Exports entries() for static prerendering with adapter-static.
 */
import { error } from '@sveltejs/kit';
import { OLL_ALGORITHMS } from '$lib/data/oll.js';
import type { PageLoad } from './$types.js';

export const prerender = true;

/** Export all OLL case IDs so adapter-static can prerender every detail page. */
export function entries() {
  return OLL_ALGORITHMS.map((alg) => ({ id: alg.id }));
}

export const load: PageLoad = ({ params }) => {
  const algorithm = OLL_ALGORITHMS.find((a) => a.id === params.id);
  if (!algorithm) {
    error(404, `OLL case "${params.id}" not found`);
  }

  const index = OLL_ALGORITHMS.indexOf(algorithm);
  const prevCase = index > 0 ? OLL_ALGORITHMS[index - 1] : null;
  const nextCase = index < OLL_ALGORITHMS.length - 1 ? OLL_ALGORITHMS[index + 1] : null;

  return { algorithm, prevCase, nextCase };
};
