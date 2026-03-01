import { useMemo, useState, type FormEventHandler } from "react";
import "./Login.css";

export interface AuthUser {
	id: number;
	username: string;
	genre: string;
	niveau: number;
	photoProfil: string[];
}

interface LoginProps {
	onAuthSuccess: (token: string, user: AuthUser) => void;
}

type AuthMode = "login" | "register";

const API_URL = "http://localhost:3001";
const AVATAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export default function Login({ onAuthSuccess }: LoginProps) {
	const [mode, setMode] = useState<AuthMode>("login");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [genre, setGenre] = useState("homme");
	const [customGenre, setCustomGenre] = useState("");
	const [photoIndex, setPhotoIndex] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const resolvedGenre = useMemo(() => {
		if (genre !== "autre") {
			return genre;
		}

		const trimmedCustomGenre = customGenre.trim();
		return trimmedCustomGenre.length > 0 ? trimmedCustomGenre : "autre";
	}, [genre, customGenre]);

	const resetFeedback = () => {
		setError("");
		setSuccessMessage("");
	};

	const handleLogin: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();
		resetFeedback();

		if (!username.trim() || !password.trim()) {
			setError("Username et password sont requis.");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: username.trim(),
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || "Échec de connexion.");
				return;
			}

			onAuthSuccess(data.token, data.user);
		} catch {
			setError("Impossible de contacter l'API de connexion.");
		} finally {
			setLoading(false);
		}
	};

	const handleRegister: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();
		resetFeedback();

		if (!username.trim() || !password.trim()) {
			setError("Username et password sont requis.");
			return;
		}

		if (genre === "autre" && !customGenre.trim()) {
			setError("Précise le genre personnalisé ou choisis Homme/Femme.");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/users/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: username.trim(),
					password,
					genre: resolvedGenre,
					photoIndex,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || "Échec de création de compte.");
				return;
			}

			setSuccessMessage("Compte créé avec succès. Connexion automatique...");
			onAuthSuccess(data.token, data.user);
		} catch {
			setError("Impossible de contacter l'API de création de compte.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-card">
				<h2>{mode === "login" ? "Connexion" : "Créer un compte"}</h2>

				<div className="auth-mode-switch">
					<button
						type="button"
						className={mode === "login" ? "active" : ""}
						onClick={() => {
							setMode("login");
							resetFeedback();
						}}
					>
						Login
					</button>
					<button
						type="button"
						className={mode === "register" ? "active" : ""}
						onClick={() => {
							setMode("register");
							resetFeedback();
						}}
					>
						Créer un compte
					</button>
				</div>

				<form onSubmit={mode === "login" ? handleLogin : handleRegister}>
					<label htmlFor="username">Username</label>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						autoComplete="username"
						placeholder="Ton username"
					/>

					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						autoComplete={mode === "login" ? "current-password" : "new-password"}
						placeholder="Ton password"
					/>

					{mode === "register" && (
						<>
							<div className="genre-group">
								<span>Genre</span>
								<div className="genre-buttons">
									<button
										type="button"
										className={genre === "homme" ? "active" : ""}
										onClick={() => setGenre("homme")}
									>
										Homme
									</button>
									<button
										type="button"
										className={genre === "femme" ? "active" : ""}
										onClick={() => setGenre("femme")}
									>
										Femme
									</button>
									<button
										type="button"
										className={genre === "autre" ? "active" : ""}
										onClick={() => setGenre("autre")}
									>
										Autre
									</button>
								</div>
							</div>

							{genre === "autre" && (
								<>
									<label htmlFor="custom-genre">Précise ton genre</label>
									<input
										id="custom-genre"
										type="text"
										value={customGenre}
										onChange={(event) => setCustomGenre(event.target.value)}
										placeholder="Ex: non-binaire"
									/>
								</>
							)}

							<div className="avatar-group">
								<span>Photo de profil</span>
								<div className="avatar-carousel">
									<button
										type="button"
										className="avatar-nav-button"
										onClick={() => {
											const currentIdx = AVATAR_OPTIONS.indexOf(photoIndex);
											const prevIdx = currentIdx === 0 ? AVATAR_OPTIONS.length - 1 : currentIdx - 1;
											setPhotoIndex(AVATAR_OPTIONS[prevIdx]);
										}}
										aria-label="Avatar précédent"
									>
										‹
									</button>
									<div className="avatar-display">
										<img
											src={`${API_URL}/assets/avatar/${photoIndex}.png`}
											alt={`Avatar ${photoIndex}`}
										/>
									</div>
									<button
										type="button"
										className="avatar-nav-button"
										onClick={() => {
											const currentIdx = AVATAR_OPTIONS.indexOf(photoIndex);
											const nextIdx = currentIdx === AVATAR_OPTIONS.length - 1 ? 0 : currentIdx + 1;
											setPhotoIndex(AVATAR_OPTIONS[nextIdx]);
										}}
										aria-label="Avatar suivant"
									>
										›
									</button>
								</div>
								<div className="avatar-indicator">
									{AVATAR_OPTIONS.map((avatar) => (
										<span
											key={avatar}
											className={photoIndex === avatar ? "dot active" : "dot"}
											onClick={() => setPhotoIndex(avatar)}
										/>
									))}
								</div>
							</div>
						</>
					)}

					{error && <p className="auth-feedback error">{error}</p>}
					{successMessage && <p className="auth-feedback success">{successMessage}</p>}

					<button className="submit-button" type="submit" disabled={loading}>
						{loading
							? "Chargement..."
							: mode === "login"
								? "Se connecter"
								: "Créer mon compte"}
					</button>
				</form>
			</div>
		</div>
	);
}
