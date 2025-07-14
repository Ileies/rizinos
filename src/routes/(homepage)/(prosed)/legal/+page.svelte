<script>
	import { PUBLIC_ORIGIN } from '$env/static/public';

	// Variablen für die dynamischen Inhalte
	export let betreiber = 'Ileies Blitz'; //'Elias Klassen';
	export let adresse = 'No address'; //'Moltkestraße 8, 53842 Troisdorf';
	export let email = `info@${PUBLIC_ORIGIN}`;
	export let liabilityEmail = `liability@${PUBLIC_ORIGIN}`;
	export let telefon = '+49 176 10867361';

	// Handelsregister und USt-ID
	let handelsregister = null;
	let registergericht = null;
	let ustId = null;
</script>

<div class="mx-auto my-8">
	<h1>Impressum</h1>

	<p>
		Angaben gemäß § 5 TMG:
	</p>

	<p>
		<strong>Betreiber:</strong><br>
		{betreiber}
	</p>

	<p>
		<strong>Adresse:</strong><br>
		{adresse}
	</p>

	<p>
		<strong>Kontakt:</strong><br>
		E-Mail: <a class="text-blue-600 hover:underline" href="mailto:{email}">{email}</a><br>
		Telefon: <a class="text-blue-600 hover:underline" href="tel:{telefon}">{telefon}</a>
	</p>

	{#if handelsregister && registergericht}
		<p>
			<strong>Handelsregister:</strong><br>
			Registergericht: {registergericht}<br>
			Registernummer: {handelsregister}
		</p>
	{/if}

	{#if ustId}
		<p>
			<strong>Umsatzsteuer-ID:</strong><br>
			gemäß § 27a Umsatzsteuergesetz: {ustId}
		</p>
	{/if}

	<h2>Haftung für Inhalte</h2>
	<p>
		Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
		nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
		Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
		Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
		rechtswidrige Tätigkeit hinweisen.
	</p>
	<p>
		Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
		allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
		erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
		Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
		entfernen.
	</p>

	<h2>Haftung für Links</h2>
	<p>
		Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
		keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
		Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
		Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden
		zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
		Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
	</p>
	<p>
		Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
		Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
		Rechtsverletzungen werden wir derartige Links umgehend entfernen.
	</p>

	<h2>Kontakt für Haftungsthemen</h2>
	<p>
		Für Fragen zur Haftung oder Hinweise auf Rechtsverletzungen erreichen Sie uns unter:
		<a class="text-blue-600 hover:underline" href="mailto:{liabilityEmail}">{liabilityEmail}</a>
	</p>
</div>


<div class="card shadow-lg mx-auto my-8 max-w-4xl">
	<div class="card-body">
		<h1 class="text-3xl font-bold text-center mb-6">Impressum</h1>

		<div class="mb-4">
			<h2 class="text-xl font-semibold">Betreiber</h2>
			<p>{betreiber}</p>
		</div>

		<div class="mb-4">
			<h2 class="text-xl font-semibold">Adresse</h2>
			<p>{adresse}</p>
		</div>

		<div class="mb-4">
			<h2 class="text-xl font-semibold">Kontakt</h2>
			<p>
				E-Mail: <a class="link" href="mailto:{email}">{email}</a><br>
				Telefon: <a class="link" href="tel:{telefon}">{telefon}</a>
			</p>
		</div>

		{#if handelsregister && registergericht}
			<div class="mb-4">
				<h2 class="text-xl font-semibold">Handelsregister</h2>
				<p>
					Registergericht: {registergericht}<br>
					Registernummer: {handelsregister}
				</p>
			</div>
		{/if}

		{#if ustId}
			<div class="mb-4">
				<h2 class="text-xl font-semibold">Umsatzsteuer-ID</h2>
				<p>gemäß § 27a Umsatzsteuergesetz: {ustId}</p>
			</div>
		{/if}

		<div class="mb-4">
			<h2 class="text-xl font-semibold">Haftung für Inhalte</h2>
			<p>
				Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
				nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
				Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
				Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
				rechtswidrige Tätigkeit hinweisen.
			</p>
			<p>
				Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
				allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
				erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
				Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
				entfernen.
			</p>
		</div>

		<div class="mb-4">
			<h2 class="text-xl font-semibold">Haftung für Links</h2>
			<p>
				Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
				keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
				Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
				Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden
				zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
				Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
			</p>
			<p>
				Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
				Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
				Rechtsverletzungen werden wir derartige Links umgehend entfernen.
			</p>
		</div>

		<div class="mb-4">
			<h2 class="text-xl font-semibold">Kontakt für Haftungsthemen</h2>
			<p>
				Für Fragen zur Haftung oder Hinweise auf Rechtsverletzungen erreichen Sie uns unter:
				<a class="link" href="mailto:{liabilityEmail}">{liabilityEmail}</a>
			</p>
		</div>
	</div>
</div>