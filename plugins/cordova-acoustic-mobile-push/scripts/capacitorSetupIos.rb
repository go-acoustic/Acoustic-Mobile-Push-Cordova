# Copyright (C) 2026 Acoustic, L.P. All rights reserved.
#
# NOTICE: This file contains material that is confidential and proprietary to
# Acoustic, L.P. and/or other developers. No license is granted under any
# intellectual or industrial property rights of Acoustic, L.P. except as may
# be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
# distribution of content from this file is prohibited.

# Called by capacitorSetup.js: adds MceConfig.json and App.entitlements to the App target
# of a Capacitor iOS project and points CODE_SIGN_ENTITLEMENTS at the entitlements file.
require 'xcodeproj'

project = Xcodeproj::Project.open(ARGV[0])
target = project.targets.find { |t| t.name == 'App' } or abort('target App not found')
group = project.main_group['App'] or abort('group App not found')

def file_ref(group, name)
  group.files.find { |f| f.path == name }
end

config = file_ref(group, 'MceConfig.json')
if config.nil?
  config = group.new_file('MceConfig.json')
  puts 'updated  App.xcodeproj (MceConfig.json added)'
else
  puts 'ok       App.xcodeproj (MceConfig.json)'
end
unless target.resources_build_phase.files_references.include?(config)
  target.resources_build_phase.add_file_reference(config)
  puts 'updated  App.xcodeproj (MceConfig.json in Resources)'
end

entitlements = file_ref(group, 'App.entitlements') || group.new_file('App.entitlements')
changed = false
target.build_configurations.each do |bc|
  next if bc.build_settings['CODE_SIGN_ENTITLEMENTS'] == 'App/App.entitlements'
  bc.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
  changed = true
end
puts(changed ? 'updated  App.xcodeproj (CODE_SIGN_ENTITLEMENTS)' : 'ok       App.xcodeproj (CODE_SIGN_ENTITLEMENTS)')

# Notification Service Extension (only when called with --notification-service)
if ARGV[1] == '--notification-service'
  ext_name = 'NotificationService'
  if project.targets.any? { |t| t.name == ext_name }
    puts 'ok       App.xcodeproj (NotificationService target)'
  else
    app_settings = target.build_configurations.first.build_settings
    deployment = app_settings['IPHONEOS_DEPLOYMENT_TARGET'] || project.build_configurations.first.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] || '15.0'
    ext = project.new_target(:app_extension, ext_name, :ios, deployment, nil, :objc)

    ext_group = project.main_group.new_group(ext_name, ext_name)
    ext_group.new_file('NotificationService.h')
    source = ext_group.new_file('NotificationService.m')
    ext_group.new_file('Info.plist')
    ext_group.new_file('NotificationService.entitlements')
    ext.add_file_references([source])

    ext.build_configurations.each do |bc|
      s = bc.build_settings
      s['PRODUCT_BUNDLE_IDENTIFIER'] = "#{app_settings['PRODUCT_BUNDLE_IDENTIFIER']}.#{ext_name}"
      s['PRODUCT_NAME'] = '$(TARGET_NAME)'
      s['INFOPLIST_FILE'] = "#{ext_name}/Info.plist"
      s['CODE_SIGN_ENTITLEMENTS'] = "#{ext_name}/#{ext_name}.entitlements"
      s['CODE_SIGN_STYLE'] = 'Automatic'
      s['DEVELOPMENT_TEAM'] = app_settings['DEVELOPMENT_TEAM'] if app_settings['DEVELOPMENT_TEAM']
      s['SKIP_INSTALL'] = 'YES'
      s['TARGETED_DEVICE_FAMILY'] = '1,2'
      s['IPHONEOS_DEPLOYMENT_TARGET'] = deployment
      s['OTHER_LDFLAGS'] = '$(inherited) -ObjC'
      s['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
      s['CLANG_ENABLE_MODULES'] = 'YES'
      s['MARKETING_VERSION'] = app_settings['MARKETING_VERSION'] || '1.0'
      s['CURRENT_PROJECT_VERSION'] = app_settings['CURRENT_PROJECT_VERSION'] || '1'
    end

    embed = target.new_copy_files_build_phase('Embed Foundation Extensions')
    embed.symbol_dst_subfolder_spec = :plug_ins
    build_file = embed.add_file_reference(ext.product_reference)
    build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
    target.add_dependency(ext)
    puts 'updated  App.xcodeproj (NotificationService target created and embedded)'
  end
end

project.save
