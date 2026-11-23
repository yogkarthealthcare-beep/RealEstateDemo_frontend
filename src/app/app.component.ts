import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CompanySettingsService } from './services/company-settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(private companySettingsService: CompanySettingsService) {}

  ngOnInit(): void {
    this.companySettingsService.loadSettings().subscribe();
  }
}
