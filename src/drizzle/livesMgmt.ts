import db from './setup.js'
import { ChatInputCommandInteraction, CacheType } from 'discord.js'
import { loseGame } from './gameMgmt.js'
import { games } from './schema.js';
import { eq, and } from 'drizzle-orm'
import { wrongCharMessage, wrongWordMessage } from '../messages.js'
import { createPreview } from './previewCreator.js'

export function calculateLives(secret: string) {
	if (secret.length <= 15) return 15
	else if (secret.length >= 26) return 26
	else return secret.length
}

export async function loseLife(interaction: ChatInputCommandInteraction<CacheType>, charMode: boolean) {
	const data = await db.select({
		lives: games.incorrectGuessesRemaining,
	}).from(games).where(
		and(
			eq(games.channelId, interaction.channelId),
			eq(games.status, 'inprogress')
		)
	)

	const { lives } = data[0]

	if (lives === 1) {
		await loseGame(interaction)
	} else {
		await db.update(games).set({
			incorrectGuessesRemaining: lives - 1
		}).where(
			and(
				eq(games.channelId, interaction.channelId),
				eq(games.status, 'inprogress')
			)
		)

		if (charMode) await wrongCharMessage(interaction, lives - 1, await createPreview(interaction))
		else await wrongWordMessage(interaction, lives - 1, await createPreview(interaction))
	}
}
