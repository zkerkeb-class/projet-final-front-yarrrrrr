import { useState, type FormEventHandler } from "react";
import { type AuthUser } from "../login/login";
import "./EditProfil.css";

interface EditProfilProps {
	user: AuthUser;
	token: string;
	onClose: () => void;
	onProfileUpdated: (updatedUser: AuthUser) => void;
}

const API_URL = "http://localhost:3001";
const AVATAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export default function EditProfil({
	user,
	token,
	onClose,
	onProfileUpdated,
}: EditProfilProps) {
	const [username, setUsername] = useState(user.username);
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [genre, setGenre] = useState(user.genre);
	const [customGenre, setCustomGenre] = useState("");
	const [photoIndex, setPhotoIndex] = useState(
		parseInt(user.photoProfil[0]?.split("/").pop()?.split(".")[0] || "1"),
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const resetFeedback = () => {
		setError("");
		setSuccessMessage("");
	};

	const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();
		resetFeedback();

		if (!username.trim()) {
			setError("Le username est requis.");
			return;
		}

		if (password.trim()) {
			if (password !== passwordConfirm) {
				setError("Les passwords ne correspondent pas.");
				return;
			}
		}

		const updateData: Record<string, unknown> = {
			username: username.trim(),
			genre,
		};

		if (password.trim()) {
			updateData.password = password;
		}

		const photoUrl = `${API_URL}/assets/avatar/${photoIndex}.png`;
		updateData.photoProfil = [photoUrl];

		setLoading(true);
		try {
			const response = await fetch(
				`${API_URL}/api/users/${user.username}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(updateData),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || "Erreur lors de la mise à jour.");
				return;
			}

			const updatedUser: AuthUser = {
				...user,
				username: updateData.username as string,
				genre: updateData.genre as string,
				photoProfil: updateData.photoProfil as string[],
			};

			setUsername(updatedUser.username);
			setPassword("");
			setPasswordConfirm("");
			setSuccessMessage("Profil mis à jour avec succès!");
			setTimeout(() => {
				onProfileUpdated(updatedUser);
				onClose();
			}, 1500);
		} catch {
			setError("Impossible de contacter l'API.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="edit-profil-overlay">
			<div className="edit-profil-modal">
				<div className="edit-profil-header">
					<h2>Éditer mon profil</h2>
					<button
						type="button"
						className="close-button"
						onClick={onClose}
						aria-label="Fermer"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							placeholder="Ton username"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Nouveau password (optionnel)</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Laisse vide pour garder le même"
							autoComplete="new-password"
						/>
					</div>

				{password.length > 0 && (
					<div className="form-group">
						<label htmlFor="password-confirm">
							Confirme le password
						</label>
						<input
							id="password-confirm"
							type="password"
							value={passwordConfirm}
							onChange={(event) => setPasswordConfirm(event.target.value)}
							placeholder="Confirme ton password"
							autoComplete="new-password"
						/>
					</div>
				)}

				<div className="form-group">
					<span className="label">Genre</span>
					<div className="genre-buttons">
						<button
							type="button"
							className={
								genre === "homme" && !customGenre ? "active" : ""
							}
							onClick={() => {
								setGenre("homme");
								setCustomGenre("");
							}}
						>
							Homme
						</button>
						<button
							type="button"
							className={
								genre === "femme" && !customGenre ? "active" : ""
							}
							onClick={() => {
								setGenre("femme");
								setCustomGenre("");
							}}
						>
							Femme
						</button>
						<button
							type="button"
							className={customGenre ? "active" : ""}
							onClick={() => setGenre("autre")}
						>
							Autre
						</button>
					</div>
				</div>

				{(customGenre || genre === "autre") && (
					<div className="form-group">
						<label htmlFor="custom-genre">Genre personnalisé</label>
						<input
							id="custom-genre"
							type="text"
							value={customGenre}
							onChange={(event) => setCustomGenre(event.target.value)}
							placeholder="Ex: non-binaire"
						/>
					</div>
				)}

					<div className="form-group">
						<span className="label">Avatar</span>
						<div className="avatar-carousel">
							<button
								type="button"
								className="avatar-nav-button"
								onClick={() => {
									const currentIdx = AVATAR_OPTIONS.indexOf(photoIndex);
									const prevIdx =
										currentIdx === 0 ? AVATAR_OPTIONS.length - 1 : currentIdx - 1;
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
									const nextIdx =
										currentIdx === AVATAR_OPTIONS.length - 1
											? 0
											: currentIdx + 1;
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

					{error && <p className="form-feedback error">{error}</p>}
					{successMessage && (
						<p className="form-feedback success">{successMessage}</p>
					)}

					<div className="form-actions">
						<button
							type="submit"
							className="submit-button"
							disabled={loading}
						>
							{loading ? "Mise à jour..." : "Enregistrer"}
						</button>
						<button
							type="button"
							className="cancel-button"
							onClick={onClose}
							disabled={loading}
						>
							Annuler
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
