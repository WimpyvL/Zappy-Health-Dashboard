'use server';

import {ai} from '@/ai/genkit';
import {defineFlow, runFlow} from 'genkit/flow';
import {z} from 'zod';
import {getFirestore} from 'firebase-admin/firestore';

/**
 * @fileoverview A sample flow demonstrating how to write data to Firestore.
 *
 * This flow takes a text input and writes it to a 'documents' collection in Firestore.
 */

export const sampleFirestoreFlow = ai.defineFlow(
  {
    name: 'sampleFirestoreFlow',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      docId: z.string(),
      message: z.string(),
    }),
  },
  async (input) => {
    const db = getFirestore();
    const docRef = db.collection('documents').doc();

    await docRef.set({
      text: input.text,
      createdAt: new Date().toISOString(),
    });

    console.log(`Document written with ID: ${docRef.id}`);

    return {
      docId: docRef.id,
      message: 'Successfully wrote document to Firestore.',
    };
  }
);

/**
 * A wrapper function to invoke the sampleFirestoreFlow.
 * This is the function you would call from your Next.js components.
 *
 * @param text The text content to write to the Firestore document.
 * @returns An object containing the new document ID and a success message.
 */
export async function writeDocumentToFirestore(text: string) {
  return await runFlow(sampleFirestoreFlow, { text });
}
