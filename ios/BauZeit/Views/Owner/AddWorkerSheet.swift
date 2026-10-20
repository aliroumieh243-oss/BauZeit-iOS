import SwiftUI

struct AddWorkerSheet: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var lang: LanguageManager
    
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var workerRateText: String = "12.00"
    @State private var clientRateText: String = "35.00"
    @State private var phone: String = ""
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                if let err = errorMessage {
                    Section {
                        Text(err)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                Section(lang.isArabic ? "بيانات العامل الجديد" : "Mitarbeiter-Daten") {
                    TextField(lang.text("Vollständiger Name"), text: $name)
                    TextField(lang.text("E-Mail Adresse"), text: $email)
                        #if os(iOS)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        #endif
                    TextField(lang.isArabic ? "رقم الهاتف (اختياري)" : "Telefonnummer (Optional)", text: $phone)
                        #if os(iOS)
                        .keyboardType(.phonePad)
                        #endif
                }
                
                Section(lang.isArabic ? "الأجور وسعر الساعة" : "Stundensätze") {
                    HStack {
                        Text(lang.isArabic ? "أجر العامل (€/h):" : "Stundenlohn (€/h):")
                        Spacer()
                        TextField("12.00", text: $workerRateText)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                            #if os(iOS)
                            .keyboardType(.decimalPad)
                            #endif
                    }
                    
                    HStack {
                        Text(lang.isArabic ? "سعر العميل AR (€/h):" : "Kundenverrechnung AR (€/h):")
                        Spacer()
                        TextField("35.00", text: $clientRateText)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                            #if os(iOS)
                            .keyboardType(.decimalPad)
                            #endif
                    }
                }
            }
            .navigationTitle(lang.isArabic ? "إضافة عامل" : "Neuer Mitarbeiter")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(lang.text("Abbrechen")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(lang.text("Speichern")) {
                        saveWorker()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }
    
    private func saveWorker() {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty,
              !email.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = lang.isArabic ? "يرجى إدخال الاسم والبريد الإلكتروني." : "Bitte Name und E-Mail eingeben."
            return
        }
        
        let workerRate = Double(workerRateText.replacingOccurrences(of: ",", with: ".")) ?? 12.0
        let clientRate = Double(clientRateText.replacingOccurrences(of: ",", with: ".")) ?? 35.0
        
        let success = authVM.addNewWorker(
            name: name,
            email: email,
            workerRate: workerRate,
            clientRate: clientRate,
            phone: phone.isEmpty ? nil : phone
        )
        
        if success {
            dismiss()
        } else {
            errorMessage = authVM.errorMessage ?? (lang.isArabic ? "تعذر حفظ العامل." : "Fehler beim Anlegen.")
        }
    }
}
