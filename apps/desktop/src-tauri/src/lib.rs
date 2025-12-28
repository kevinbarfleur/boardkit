use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter, Manager,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn create_menu(app: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let app_menu = Submenu::with_items(
        app,
        "Boardkit",
        true,
        &[
            &PredefinedMenuItem::about(app, Some("About Boardkit"), None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::services(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    let new_board = MenuItem::with_id(app, "new_board", "New Board", true, Some("CmdOrCtrl+N"))?;
    let open_file = MenuItem::with_id(app, "open_file", "Open...", true, Some("CmdOrCtrl+O"))?;
    let save = MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?;
    let export = MenuItem::with_id(app, "export", "Export as .boardkit", true, Some("CmdOrCtrl+Shift+E"))?;

    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &new_board,
            &open_file,
            &PredefinedMenuItem::separator(app)?,
            &save,
            &export,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    let command_palette = MenuItem::with_id(app, "command_palette", "Command Palette...", true, Some("CmdOrCtrl+K"))?;
    let reset_view = MenuItem::with_id(app, "reset_view", "Reset View", true, Some("CmdOrCtrl+0"))?;

    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &command_palette,
            &PredefinedMenuItem::separator(app)?,
            &reset_view,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::fullscreen(app, None)?,
        ],
    )?;

    let window_menu = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )?;

    Menu::with_items(app, &[&app_menu, &file_menu, &edit_menu, &view_menu, &window_menu])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let cmd_shift_space = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);
                        if shortcut == &cmd_shift_space {
                            // Show and focus the main window
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                // Emit event to open command palette
                                let _ = window.emit("open-command-palette", ());
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Create and set the menu
            let menu = create_menu(app.handle())?;
            app.set_menu(menu)?;

            // Register global shortcut: Cmd+Shift+Space
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);
            app.global_shortcut().register(shortcut)?;

            Ok(())
        })
        .on_menu_event(|app, event| {
            if let Some(window) = app.get_webview_window("main") {
                match event.id().as_ref() {
                    "new_board" => {
                        let _ = window.emit("menu-new-board", ());
                    }
                    "open_file" => {
                        let _ = window.emit("menu-open-file", ());
                    }
                    "save" => {
                        let _ = window.emit("menu-save", ());
                    }
                    "export" => {
                        let _ = window.emit("menu-export", ());
                    }
                    "command_palette" => {
                        let _ = window.emit("open-command-palette", ());
                    }
                    "reset_view" => {
                        let _ = window.emit("menu-reset-view", ());
                    }
                    _ => {}
                }
            }
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
